pragma solidity ^0.5.10;
pragma experimental ABIEncoderV2;

import "./SafeMath.sol";
import "./ERC20Interface.sol";

contract P2PLending {
     
    address payable owner;
    address public tokenAddress;
    uint requestCount;
    
    enum UserType {
        LENDER,
        BORROWER,
        GUARANTOR
    }
    
    enum RequestStatus {
        GURANTOR_APPROVED, 
        GURANTOR_REJECTED, 
        LENDER_APPROVED,
        PAYBACK_SUCCESS,
        PAYBACK_PARTIAL,
        GURANTOR_AWAITING,
        BORROWER_APPROVED,
        BORROWER_REJECTED,
        LOAN_CLOSED
    }
    
    struct User {
        UserType userType;
        address payable userAddress;
        bool registered;
    }
    
    struct AvailableRequestsForLending {
        uint requestId;
        uint requiredLoanAmount;
        uint interestToBeEarned;
        address gurantor;
    }
    
    AvailableRequestsForLending[] availableRequests;
    
    struct LoanRequest {
        User borrower;
        uint amountRequired;
        uint paybackDate;
        uint interestToBePaid;
        RequestStatus status;
        uint expectedGurantorInterest;
        address payable guarantor;
        address payable lender;
        bool registered;
    }
    
    event newLoanRequestCreated(LoanRequest loanRequest);
    
    event newUserRegistered(address userAddress, UserType userType);
    
    event guranteeProvided(address gurantor, LoanRequest loanRequest);
    
    event guranteeApproved(LoanRequest loanRequest);
    
    event guranteeRejected(LoanRequest loanRequest);
    
    event lendingProcessed(address lender, LoanRequest loanRequest);
    
    event loanPaid(bool completePayback, LoanRequest loanRequest);
    
    event lendingWithdrawn(LoanRequest loanRequest);
    
    constructor () public {
        owner = msg.sender;
        requestCount = 0;
        tokenAddress = 0x8F10620D7C99d9C894C51dd6967e49B3aC4E7216;
    }
    
    mapping (address => User) registeredUser;
    mapping (uint => LoanRequest) loanRequests;
    mapping (address => LoanRequest) requestsByBorrowers;
    
    modifier isBorrower() {
        registeredUser[msg.sender].userType = UserType.BORROWER;
        _;
    }
    
    modifier isGurantor() {
        registeredUser[msg.sender].userType = UserType.GUARANTOR;
        _;
    }
    
    modifier isLender() {
        registeredUser[msg.sender].userType = UserType.LENDER;
        _;
    }
    
    modifier isOwner() {
        msg.sender == owner;
        _;
    }
    
    function registerUser(UserType _userType) public {
        if (registeredUser[msg.sender].registered){
            revert();
        }
        else {
            User memory newUser = User(_userType, msg.sender, true);
            registeredUser[msg.sender] = newUser;
            emit newUserRegistered(msg.sender, _userType);
        }
    }
    
    function requestLoan(uint _amountRequired, uint _paybackDate, uint _interestToBePaid) public isBorrower {
        require(_amountRequired>0);
        require(_interestToBePaid>0);
        if (!registeredUser[msg.sender].registered) {
            revert();
        }
        else {
            if(requestsByBorrowers[msg.sender].status != RequestStatus.GURANTOR_AWAITING){
                revert();
            }
            else {
                LoanRequest memory newRequest = LoanRequest(registeredUser[msg.sender], _amountRequired, _paybackDate, _interestToBePaid, RequestStatus.GURANTOR_AWAITING, 0, owner, owner, true);
                loanRequests[requestCount] = newRequest;
                requestCount++;
                requestsByBorrowers[msg.sender] = newRequest;
                emit newLoanRequestCreated(loanRequests[requestCount]);
            }
        }
    }
    
    function guranteeRequest(uint _requestId, uint _interestExpected) public payable isGurantor{
        if(!loanRequests[_requestId].registered){
            revert();
        }
        uint requiredAmount = loanRequests[_requestId].amountRequired;
        require(ERC20Interface(tokenAddress).transferFrom(msg.sender, address(this), requiredAmount));
        // require (msg.value == requiredAmount * 1000000000000000000);
        LoanRequest memory request = loanRequests[_requestId];
        request.guarantor = msg.sender;
        request.expectedGurantorInterest = _interestExpected;
        request.status = RequestStatus.GURANTOR_APPROVED;
        loanRequests[_requestId] = request;
        emit guranteeProvided(msg.sender, loanRequests[_requestId]);
    }
    
    function viewRequestCount() internal view returns (uint) {
        return requestCount;
    }
    
    function approveGurantee(uint _requestId) public isBorrower {
        if(!loanRequests[_requestId].registered){
            revert();
        }
        if(loanRequests[_requestId].status!= RequestStatus.GURANTOR_APPROVED){
            revert();
        }
        if(loanRequests[_requestId].borrower.userAddress != msg.sender){
            revert();
        }
        loanRequests[_requestId].status = RequestStatus.BORROWER_APPROVED;
        emit guranteeApproved(loanRequests[_requestId]);
    }
    
    function rejectGurantee(uint _requestId) public isBorrower {
        if(!loanRequests[_requestId].registered){
            revert();
        }
        if(loanRequests[_requestId].status!= RequestStatus.GURANTOR_APPROVED){
            revert();
        }
        if(loanRequests[_requestId].borrower.userAddress != msg.sender){
            revert();
        }
        loanRequests[_requestId].status = RequestStatus.BORROWER_REJECTED;
        ERC20Interface(tokenAddress).transferFrom(address(this), loanRequests[_requestId].guarantor, loanRequests[_requestId].amountRequired);
        // loanRequests[_requestId].guarantor.transfer(loanRequests[_requestId].amountRequired);
        emit guranteeRejected(loanRequests[_requestId]);
    }
    
    function viewRequestsForLending() public isLender returns (AvailableRequestsForLending[] memory){
        delete availableRequests;
        if(requestCount == 0){
            revert();
        }
        else{
            for (uint i = 0 ; i < requestCount; i++ ){
                AvailableRequestsForLending memory request = AvailableRequestsForLending(i, loanRequests[i].amountRequired, loanRequests[i].interestToBePaid - loanRequests[i].expectedGurantorInterest, loanRequests[i].guarantor);
                availableRequests.push(request);
            }
            return availableRequests;
        }
    }
    
    function lendMoney(uint _requestId) public payable isLender {
        if(!loanRequests[_requestId].registered){
            revert();
        }
        if(loanRequests[_requestId].status != RequestStatus.BORROWER_APPROVED){
            revert();
        }
        uint requiredAmount = loanRequests[_requestId].amountRequired;
        require(ERC20Interface(tokenAddress).transferFrom(msg.sender, address(this), requiredAmount));
        // require (msg.value == requiredAmount * 1000000000000000000);
        loanRequests[_requestId].status = RequestStatus.LENDER_APPROVED;
        ERC20Interface(tokenAddress).transferFrom(address(this), loanRequests[_requestId].borrower.userAddress, loanRequests[_requestId].amountRequired);
        // loanRequests[_requestId].borrower.userAddress.transfer(loanRequests[_requestId].amountRequired);
        emit lendingProcessed(msg.sender, loanRequests[_requestId]);
    }
    
    function paybackLoan(uint _requestId) public payable isBorrower {
        if(!loanRequests[_requestId].registered){
            revert();
        }
        if(loanRequests[_requestId].status != RequestStatus.LENDER_APPROVED){
            revert();
        }
        if(block.timestamp > loanRequests[_requestId].paybackDate) {
            revert();
        }
        if(msg.value < loanRequests[_requestId].amountRequired + loanRequests[_requestId].interestToBePaid) {
            loanRequests[_requestId].status = RequestStatus.PAYBACK_PARTIAL;
            emit loanPaid(false, loanRequests[_requestId]);
        }
        else {
            loanRequests[_requestId].status = RequestStatus.PAYBACK_SUCCESS;
            ERC20Interface(tokenAddress).transferFrom(address(this), loanRequests[_requestId].guarantor, loanRequests[_requestId].amountRequired + loanRequests[_requestId].expectedGurantorInterest);
            // loanRequests[_requestId].guarantor.transfer(loanRequests[_requestId].amountRequired + loanRequests[_requestId].expectedGurantorInterest);
            ERC20Interface(tokenAddress).transferFrom(address(this), loanRequests[_requestId].lender, loanRequests[_requestId].amountRequired + loanRequests[_requestId].interestToBePaid - loanRequests[_requestId].expectedGurantorInterest);
            // loanRequests[_requestId].lender.transfer(loanRequests[_requestId].amountRequired + loanRequests[_requestId].interestToBePaid - loanRequests[_requestId].expectedGurantorInterest);
            emit loanPaid(true, loanRequests[_requestId]);
        }
    }
    
    function withdrawLendingAmount(uint _requestId) public isLender {
        if(!loanRequests[_requestId].registered){
            revert();
        }
        if(loanRequests[_requestId].status == RequestStatus.PAYBACK_SUCCESS || block.timestamp < loanRequests[_requestId].paybackDate){
            revert();
        }
        ERC20Interface(tokenAddress).transferFrom(address(this), loanRequests[_requestId].lender, loanRequests[_requestId].amountRequired);
        // loanRequests[_requestId].lender.transfer(loanRequests[_requestId].amountRequired);
        emit lendingWithdrawn(loanRequests[_requestId]);
        }
    
}
    
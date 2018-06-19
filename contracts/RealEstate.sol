pragma solidity ^0.4.23;

contract RealEstate {
    address public owner;
    
    constructor() public {
        owner = msg.sender;
    }
}
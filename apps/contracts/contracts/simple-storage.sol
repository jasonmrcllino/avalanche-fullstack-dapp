// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SimpleStorage {
    // menyimpan sebuah nilai dalam bentuk integer 256
    uint256 private storedValue;

    address public owner;
    // event untuk melacak perubahan pemilik
    event OwnerSet(address indexed oldOwner, address indexed newOwner);

    // set pemilik kontrak saat deploy
    constructor() {
        owner = msg.sender;
        emit OwnerSet(address(0), owner);
    }
    // modifier untuk membatasi akses hanya untuk pemilik
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    // track perubahan saat update
    event ValueUpdated(uint256 newValue);

    // simpan value ke blockchain (write)
    function setValue(uint256 _value) public onlyOwner {
        storedValue = _value;
        emit ValueUpdated(_value);
    }


    function getValue() public view returns (uint256) {
        return storedValue;
    }
}
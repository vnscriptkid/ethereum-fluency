pragma solidity ^0.4.17;

contract Lottery {
    address public manager;
    address[] public players;

    function Lottery() public {
        manager = msg.sender;
    }

    // payable means user sends ETH along
    function enter() public payable {
        // player must have at least 0.01 ETH
        require(msg.value > .01 ether);

        // add sender to players list
        players.push(msg.sender);
    }

    function random() public view returns (uint) {
        return uint(keccak256(block.difficulty, now, players)); // sha3
    }

    function pickWinner() public mustBeManager {
        require(msg.sender == manager);

        uint idx = random() % players.length;

        players[idx].transfer(this.balance);

        // reset contract for a new game
        players = new address[](0);// new address array with initial size of 0
    }

    modifier mustBeManager() {
        // only manager can execute
        require(msg.sender == manager);
        _;
    }

    function getPlayers() public view returns (address[]) {
        return players;
    }
}
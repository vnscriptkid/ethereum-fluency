const { Web3, utils } = require('web3');
const ganache = require('ganache');
const assert = require('assert');
const { interface, bytecode } = require('../compile');

// create web3 instance and connect to ganache
const web3 = new Web3(ganache.provider());
let lottery;
let accounts;

beforeEach(async () => {
    // get accounts from ganache test network
    accounts = await web3.eth.getAccounts();
    // deploy contract using account[0]
    lottery = await new web3.eth.Contract(JSON.parse(interface))
    .deploy({ data: bytecode })
    .send({ from: accounts[0], gas: '1000000' }); // gas in wei
});

describe('Lottery', () => {
    it('deploys a contract', () => {
        assert.ok(lottery.options.address);
    });

    it('can not enter a lottery with less than 0.01 ETH', async () => {
        try {
            await lottery.methods.enter().send({ from: accounts[1], value: '1' });
            assert.fail('Expected transaction to fail');
        } catch (error) {
            assert(error.message.includes('revert'));
        }
    });

    it('can enter a lottery', async () => {
        // ACT
        await lottery.methods.enter().send({ from: accounts[0], value: utils.toWei('1', 'ether') });
        // ASSERT
        const players = await lottery.methods.getPlayers().call();
        assert.equal(players.length, 1);
        assert.equal(players[0], accounts[0]);
    });

    it('multiple players can enter', async () => {
        // ACT
        await lottery.methods.enter().send({ from: accounts[1], value: utils.toWei('1', 'ether') });
        await lottery.methods.enter().send({ from: accounts[2], value: utils.toWei('2', 'ether') });
        // ASSERT
        const players = await lottery.methods.getPlayers().call();
        assert.equal(players.length, 2);
        assert.equal(players[0], accounts[1]);
        assert.equal(players[1], accounts[2]);
    });

    it('only manager can call pickWinner', async () => {
        // ARRANGE
        await lottery.methods.enter().send({ from: accounts[1], value: utils.toWei('1', 'ether') });

        try {
            // ACT
            await lottery.methods.pickWinner().send({ from: accounts[1] });
            // ASSERT
            assert.fail('Expected transaction to fail');
        } catch (error) {
            assert(error.message.includes('revert'));
        }
    });

    it('can pick a winner', async () => {
        // ARRANGE
        await lottery.methods.enter().send({ from: accounts[1], value: utils.toWei('1', 'ether') });
        
        const player1Balance = await web3.eth.getBalance(accounts[1]);

        // ACT
        await lottery.methods.pickWinner().send({ from: accounts[0] });

        // ASSERT: one of the players received all the ETH
        const player1FinalBalance = await web3.eth.getBalance(accounts[1]);
        const difference = player1FinalBalance - player1Balance;

        console.log(`Difference: ${difference}`);

        assert(difference > 0, `Player 1 did not receive all the ETH. Initial balance: ${player1Balance}, final balance: ${player1FinalBalance}`);
    });
});
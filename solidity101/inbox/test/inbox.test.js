const { Web3 } = require('web3');
const ganache = require('ganache');
const assert = require('assert');
const { interface, bytecode } = require('../compile');

// create web3 instance and connect to ganache
const web3 = new Web3(ganache.provider());
let inbox;
let accounts;
beforeEach(async () => {
    // get accounts from ganache test network
    accounts = await web3.eth.getAccounts();
    // deploy contract using account[0]
    inbox = await new web3.eth.Contract(JSON.parse(interface))
    .deploy({
        arguments: ['Hi there!'],
        data: bytecode,
    })
    .send({ from: accounts[0], gas: '1000000' });
});

describe('Inbox', () => {
    it('deploys a contract', () => {
        assert.ok(inbox.options.address);
    });

    it('has a greeting', async () => {
        const result = await inbox.methods.message().call();
        assert.equal(result, 'Hi there!');
    });

    it('can change the message', async () => {
        await inbox.methods.setMessage('Bye').send({ from: accounts[0] });
        const result = await inbox.methods.message().call();
        assert.equal(result, 'Bye');
    });
});
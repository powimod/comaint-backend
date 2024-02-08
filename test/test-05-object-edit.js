'use strict'
var expect = require('chai').expect;
let chai = require('chai');
let chaiHttp = require('chai-http');

const assert = require('assert')
const util = require('./helpers/util.js')
const account = require('./helpers/account.js')

const ROUTE_GET_BY_ID = 'api/v1/user/:userId';

let refUser = null
let dbUser = null


describe('Test user edition', () => {

	before( async () =>  {
		util.loadConfig()
		await util.connectDb()
		refUser = util.testUser1
		dbUser = await account.declareUser(refUser)
	}),
	after( async () =>  {
		await util.disconnectDb()
	}),


	describe('Test root', () => {
		describe (`Control /${ROUTE_GET_BY_ID} route`, () => {
			it(`Should find user with it's ID`, async () => {
				let route = ROUTE_GET_BY_ID.replace(':userId', dbUser.id)
				let json = await util.requestJsonGet(route, {})
				expect(json).to.have.property('ok')
				expect(json.ok).to.be.a('boolean')
					.and.to.be.equal(true)
				expect(json).to.have.property('data')
				expect(json.data).to.have.property('user')
				const foundUser = json.data.user

				expect(foundUser).to.be.a('object')

				expect(foundUser).to.have.property('id')
				expect(foundUser.id).to.be.a('number').and.to.be.equal(dbUser.id)

				expect(foundUser).to.have.property('firstname')
				expect(foundUser.firstname).to.be.a('string').and.to.be.equal(dbUser.firstname)

				expect(foundUser).to.have.property('lastname')
				expect(foundUser.lastname).to.be.a('string').and.to.be.equal(dbUser.lastname)

				expect(foundUser).to.have.property('companyId')
				if (foundUser.companyId !== null)
					expect(foundUser.companyId).to.be.a('number').and.to.be.equal(dbUser.companyId)

				// should not have password hash since it's a secret
				expect(foundUser).not.to.have.property('password')
			})
		})

	})

})

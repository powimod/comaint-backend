'use strict'
var expect = require('chai').expect;
let chai = require('chai');
let chaiHttp = require('chai-http');

const assert = require('assert')
const util = require('./helpers/util.js')
const account = require('./helpers/account.js')

const ROUTE_CREATE = 'api/v1/user/create'
const ROUTE_DELETE = 'api/v1/user/:userId'

let dbUser = null
let refUserToDelete = null
let userToDelete = null

describe('Test user delete', () => {

	before( async () =>  {
		util.loadConfig()
		await util.connectDb()
		dbUser = await account.declareUser(util.testUser1)
		refUserToDelete = util.testUser2
		await account.accountPurge(refUserToDelete.email)
	}),
	after( async () =>  {
		await util.disconnectDb()
	}),

	describe('Test object delete ', () => {
		//describe (`Control /${ROUTE_DELETE} route`, () => {
			it(`Create user to work on`, async () => {
				let json = await util.requestJsonPost(ROUTE_CREATE, {
					user: refUserToDelete
				})
				expect(json).to.have.property('ok')
				expect(json.ok).to.be.a('boolean')
					.and.to.be.equal(true)

				expect(json).to.have.property('data')
				expect(json.data).to.have.property('user')
				expect(json.data.user).to.be.a('object')

				userToDelete = json.data.user

				expect(userToDelete).to.have.property('companyId')
				expect(userToDelete.companyId).not.to.be.null
				expect(userToDelete.companyId).to.be.a('number').and.not.to.be.equal(0)

			}),
			it(`Should detect invalid user ID`, async () => {
				let route = ROUTE_DELETE.replace(':userId', 'abc')
				let json = await util.requestJsonDelete(route, {})
				expect(json).to.have.property('ok')
				expect(json.ok).to.be.a('boolean').and.to.be.equal(false)
				expect(json).to.have.property('error')
				expect(json.error).to.be.a('string').and.to.match(/User ID .* is not a number/)
			}),
			it(`Should detect non existent user ID`, async () => {
				let route = ROUTE_DELETE.replace(':userId', 65535)
				let json = await util.requestJsonDelete(route, {})
				expect(json).to.have.property('ok')
				expect(json.ok).to.be.a('boolean').and.to.be.equal(false)
				expect(json).to.have.property('error')
				expect(json.error).to.be.a('string').and.to.match(/User ID .* not found/)
			}),
			it(`Should accept to delete user`, async () => {
				let route = ROUTE_DELETE.replace(':userId', userToDelete.id)
				let json = await util.requestJsonDelete(route, {})
				expect(json.ok).to.be.a('boolean').and.to.be.equal(true)
			}),
			it(`check user no more exists`, async () => {
				let foundUser = await account.findUserById(userToDelete.id)
				expect(foundUser).to.be.null
			})
		//})
	})
})

'use strict'
var expect = require('chai').expect;
let chai = require('chai');
let chaiHttp = require('chai-http');

const assert = require('assert')
const util = require('./helpers/util.js')
const account = require('./helpers/account.js')

const ROUTE_CREATE = 'api/v1/user/create'
const ROUTE_DELETE = 'api/v1/user/:userId/delete'

let dbUser = null
let refUserToDelete = null
let dbUserToDelete = null 

describe('Test user recursive delete', () => {

	before( async () =>  {
		util.loadConfig()
		await util.connectDb()
		dbUser = await account.declareUser(util.testUser1)
		refUserToDelete = util.testUser2
		dbUserToDelete = await account.declareUser(util.testUser2)
	}),
	after( async () =>  {
		await util.disconnectDb()
	}),

	describe('Test object delete', () => {
		//describe (`Control /${ROUTE_DELETE} route`, () => {
			it(`Should refuse to delete user with token without recursion`, async () => {
				let route = ROUTE_DELETE.replace(':userId', dbUserToDelete.id)
				let json = await util.requestJsonPost(route, {
					recursive: false
				})
				expect(json).to.have.property('ok')
				expect(json.ok).to.be.a('boolean').and.to.be.equal(false)
				expect(json).to.have.property('error')
				expect(json.error).to.be.a('string').and.to.match(/Can not delete .* because it has children/)
			}),
			it(`Should accept to delete user with recursion`, async () => {
				let route = ROUTE_DELETE.replace(':userId', dbUserToDelete.id)
				let json = await util.requestJsonPost(route, {
					recursive: true
				})
				expect(json).to.have.property('ok')
				expect(json.ok).to.be.a('boolean').and.to.be.equal(true)
			}),
			it(`Should user no more exists`, async () => {
				let foundUser = await account.findUserById(dbUserToDelete.id)
				expect(foundUser).to.be.null
			})
		//})
	})
})

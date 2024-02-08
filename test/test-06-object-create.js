'use strict'
var expect = require('chai').expect;
let chai = require('chai');
let chaiHttp = require('chai-http');

const assert = require('assert')
const util = require('./helpers/util.js')
const account = require('./helpers/account.js')

//const ROUTE_GET_BY_ID = 'api/v1/user/:userId';
const ROUTE_CREATE = 'api/v1/user/create'

let dbUser = null
let refNewUser = null

describe('Test user edition', () => {

	before( async () =>  {
		util.loadConfig()
		await util.connectDb()
		dbUser = await account.declareUser(util.testUser1)
		refNewUser = util.testUser2
		await account.accountPurge(util.testUser2.email)
	}),
	after( async () =>  {
		await util.disconnectDb()
	}),


	describe('Test object creation', () => {
		describe (`Control /${ROUTE_CREATE} route`, () => {
			it(`Should detect missing user in request body`, async () => {
				let json = await util.requestJsonPost(ROUTE_CREATE, { })
				expect(json).to.have.property('ok')
				expect(json.ok).to.be.a('boolean')
					.and.to.be.equal(false)
				expect(json).to.have.property('error')
				expect(json.error).to.be.a('string')
					.and.to.be.equal(`Can't find <user> object in request body`)
			}),
			it(`Should detect invalid user in request body`, async () => {
				let json = await util.requestJsonPost(ROUTE_CREATE, {
					user: "invalid"
				})
				expect(json).to.have.property('ok')
				expect(json.ok).to.be.a('boolean')
					.and.to.be.equal(false)
				expect(json).to.have.property('error')
				expect(json.error).to.be.a('string')
					.and.to.be.equal('Object User is not an object')
			}),
			it(`Should accept valid user in request body`, async () => {
				let json = await util.requestJsonPost(ROUTE_CREATE, {
					user: refNewUser
				})
				expect(json).to.have.property('ok')
				expect(json.ok).to.be.a('boolean')
					.and.to.be.equal(true)

				expect(json).to.have.property('user')
				const foundUser = json.user
				expect(foundUser).to.be.a('object')

				expect(foundUser).to.have.property('id')
				expect(foundUser.id).to.be.a('number')

				expect(foundUser).to.have.property('firstname')
				expect(foundUser.firstname).to.be.a('string').and.to.be.equal(refNewUser.firstname)

				expect(foundUser).to.have.property('lastname')
				expect(foundUser.lastname).to.be.a('string').and.to.be.equal(refNewUser.lastname)

				expect(foundUser).to.have.property('companyId')
				expect(foundUser.companyId).to.be.null

				expect(foundUser).to.have.property('active')
				expect(foundUser.active).to.be.a('boolean').and.to.be.equal(true)

				expect(foundUser).to.have.property('administrator')
				expect(foundUser.administrator).to.be.a('boolean').and.to.be.equal(false)

				// should not have password hash since it's a secret
				expect(foundUser).not.to.have.property('password')

			})


		})

	})

})

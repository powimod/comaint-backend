'use strict'
var expect = require('chai').expect;
let chai = require('chai');
let chaiHttp = require('chai-http');

const assert = require('assert')
const util = require('./helpers/util.js')
const account = require('./helpers/account.js')

let refUser = null

const ROUTE_REGISTER = 'api/v1/auth/register'
const ROUTE_VALIDATE = 'api/v1/auth/validateRegistration'

describe('Test user registration', () => {

	before( async () =>  {
		util.loadConfig()
		await util.connectDb()
		refUser = util.testUser1
		await account.accountPurge(refUser.email)
	}),
	after( async () =>  {
		await util.disconnectDb()
	}),

	describe('Test root', () => {
		describe (`Control /${ROUTE_REGISTER} route`, () => {
			it(`Should detect missing email in request body`, async () => {
				let json = await util.requestJsonPost(ROUTE_REGISTER, {
						email_missing:'',
						password:'',
						firstname:'',
						lastname:''
					})
				expect(json).to.have.property('ok')
				expect(json.ok).to.be.a('boolean')
					.and.to.be.equal(false)
				expect(json).to.have.property('error')
				expect(json.error).to.be.a('string')
					.and.to.be.equal(`Can't find <email> in request body`)
			}),
			it(`Should create account`, async () => {
				assert(refUser !== null)
				let json = await util.requestJsonPost(ROUTE_REGISTER, {
						email: refUser.email,
						password:refUser.password,
						firstname:refUser.firstname,
						lastname:refUser.lastname
					})
				expect(json).to.have.property('ok')
				expect(json.ok).to.be.a('boolean')
					.and.to.be.equal(true)
				expect(json).to.have.property('data')

				expect(json.data).to.have.property('userId')
				expect(json.data.userId).to.be.a('number')

				expect(json.data).to.have.property('companyId')
				expect(json.data.companyId).to.be.null
				expect(json.data).to.have.property('access-token')
				expect(json.data).to.have.property('refresh-token')

				expect(json.data).to.have.property('firstname')
				expect(json.data.firstname).to.be.a('string')
					.and.to.be.equal(refUser.firstname)
				expect(json.data).to.have.property('lastname')
				expect(json.data.lastname).to.be.a('string')
					.and.to.be.equal(refUser.lastname)

				const user = await account.findUserByEmail(refUser.email)
				expect(user).not.to.be.null
				expect(user).to.have.property('id')
				expect(user.id).to.be.a('number')

				expect(user).to.have.property('validation_code')
				expect(user.validation_code).to.be.a('number')

				expect(user).to.have.property('firstname')
				expect(user.firstname).to.be.a('string')
					.and.to.be.equal(refUser.firstname)

				expect(user).to.have.property('lastname')
				expect(user.lastname).to.be.a('string')
					.and.to.be.equal(refUser.lastname)

				expect(user).to.have.property('account_locked')
				expect(user.account_locked).to.be.a('number')
					.and.to.be.equal(1)
			})

		}),
		describe (`Control /${ROUTE_VALIDATE} route`, () => {
			it(`Should accept validtion code`, async () => {
				let user = await account.findUserByEmail(refUser.email)
				expect(user).not.to.be.null

				expect(user.validation_code).to.be.a('number')
				let json = await util.requestJsonPost(ROUTE_VALIDATE, {
						'validationCode': user.validation_code,
					})
				expect(json).to.have.property('ok')
				expect(json.ok).to.be.a('boolean')
					.and.to.be.equal(true)

				user = await account.findUserByEmail(refUser.email)
				expect(user).not.to.be.null
				expect(json).to.have.property('ok')
				expect(json.ok).to.be.a('boolean')
					.and.to.be.equal(true)

				expect(user).to.have.property('validation_code')
				expect(user.validation_code).to.be.null

				expect(user).to.have.property('account_locked')
				expect(user.account_locked).to.be.a('number')
					.and.to.be.equal(0)
			})
		})
	})

})

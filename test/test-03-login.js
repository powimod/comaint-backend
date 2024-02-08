'use strict'
var expect = require('chai').expect;
let chai = require('chai');
let chaiHttp = require('chai-http');

const assert = require('assert')
const util = require('./helpers/util.js')
const account = require('./helpers/account.js')

let refUser = null
let user = null

const ROUTE_LOGIN = 'api/v1/auth/login'
const ROUTE_LOGOUT = 'api/v1/auth/logout'

describe('Test user registration', () => {

	before( async () =>  {
		util.loadConfig()
		await util.connectDb()
		refUser = util.testUser1
		user = await account.declareUser(refUser)
	}),
	after( async () =>  {
		await util.disconnectDb()
	}),

	describe('Test root', () => {
		describe (`Control refresh token in database`, () => {
			it(`Should find a refresh token in database`, async () => {
				const result = await util.dbRequest("SELECT * FROM tokens WHERE id_user = ?", [ user.id ] )
				expect(result.length).to.be.equal(1)
			}),
			it(`Delete current refresh token database`, async () => {
				const result = await util.dbRequest("DELETE FROM tokens WHERE id_user = ?", [ user.id ] )
				expect(result.affectedRows).to.be.equal(1)
			})
		}),
		describe (`Control /${ROUTE_LOGIN} route`, () => {

			it(`Should detect missing email in request body`, async () => {
				let json = await util.requestJsonPost(ROUTE_LOGIN, {
						email_missing:'',
						password: refUser.password
					})
				expect(json).to.have.property('ok')
				expect(json.ok).to.be.a('boolean')
					.and.to.be.equal(false)
				expect(json).to.have.property('error')
				expect(json.error).to.be.a('string')
					.and.to.be.equal(`Can't find <email> in request body`)
			}),

			it(`Should detect missing password in request body`, async () => {
				let json = await util.requestJsonPost(ROUTE_LOGIN, {
						email: refUser.email,
						password_is_missing:''
					})
				expect(json).to.have.property('ok')
				expect(json.ok).to.be.a('boolean')
					.and.to.be.equal(false)
				expect(json).to.have.property('error')
				expect(json.error).to.be.a('string')
					.and.to.be.equal(`Can\'t find <password> in request body`)
			})

			it(`Should detect missing wrong`, async () => {
				let json = await util.requestJsonPost(ROUTE_LOGIN, {
						email: refUser.email,
						password: 'b4d!P4ssword'
					})
				expect(json).to.have.property('ok')
				expect(json.ok).to.be.a('boolean')
					.and.to.be.equal(false)
				expect(json).to.have.property('error')
				expect(json.error).to.be.a('string')
					.and.to.be.equal(`email inconnu ou password incorrect`) // FIXME translation issue
			})

			it(`Should accept login`, async () => {
				let json = await util.requestJsonPost(ROUTE_LOGIN, {
						email: refUser.email,
						password: refUser.password
					})
				expect(json).to.have.property('ok')
				expect(json.ok).to.be.a('boolean')
					.and.to.be.equal(true)

				expect(json.data).to.have.property('userId')
				expect(json.data.userId).to.be.a('number')

				expect(json.data).to.have.property('companyId')
				expect(json.data.companyId).to.be.null
				expect(json.data).to.have.property('access-token')
				expect(json.data).to.have.property('refresh-token')

				expect(json.data).to.have.property('firstname')
				expect(json.data.firstname).to.be.a('string')
				expect(json.data).to.have.property('lastname')
				expect(json.data.lastname).to.be.a('string')
			})
		}),

		describe (`Control /${ROUTE_LOGOUT} route`, () => {
			it(`Should detect missing rereshToken in logout`, async () => {
				let json = await util.requestJsonPost(ROUTE_LOGOUT, {
					refreshTokenIsMissing: ""
				})
				expect(json).to.have.property('ok')
				expect(json.ok).to.be.a('boolean')
					.and.to.be.equal(false)
				expect(json).to.have.property('error')
				expect(json.error).to.be.a('string')
					.and.to.be.equal(`Can't find <refreshToken> in request body`)
			}),
			it(`Should find refresh token in database`, async () => {
				const result = await util.dbRequest("SELECT * FROM tokens WHERE id_user = ?", [ user.id ] )
				expect(result.length).to.equal(1)
			}),
			it(`Should accept logout`, async () => {
				let json = await util.requestJsonPost(ROUTE_LOGOUT, {
					refreshToken: util.getRefreshToken()
				})
				expect(json).to.have.property('ok')
				expect(json.ok).to.be.a('boolean').and.to.be.equal(true)
			}),
			it(`Should not find refresh token in database`, async () => {
				const result = await util.dbRequest("SELECT * FROM tokens WHERE id_user = ?", [ user.id ] )
				expect(result.length).to.equal(0)
			})
		})

	})

})

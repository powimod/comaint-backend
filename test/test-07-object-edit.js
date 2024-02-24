'use strict'
var expect = require('chai').expect;
let chai = require('chai');
let chaiHttp = require('chai-http');

const assert = require('assert')
const util = require('./helpers/util.js')
const account = require('./helpers/account.js')

//const ROUTE_GET_BY_ID = 'api/v1/user/:userId';
const ROUTE_CREATE = 'api/v1/user/create'
const ROUTE_EDIT = 'api/v1/user/:userId'

let dbUser = null
let refUserToEdit = null
let userToEdit = null

describe('Test user edition', () => {

	before( async () =>  {
		util.loadConfig()
		await util.connectDb()
		dbUser = await account.declareUser(util.testUser1)
		refUserToEdit = util.testUser2
		await account.accountPurge(util.testUser2.email)
	}),
	after( async () =>  {
		await util.disconnectDb()
	}),

	describe('Test object creation', () => {
		describe (`Control /${ROUTE_CREATE} route`, () => {
			it(`Create user to work on`, async () => {
				let json = await util.requestJsonPost(ROUTE_CREATE, {
					user: refUserToEdit
				})
				expect(json).to.have.property('ok')
				expect(json.ok).to.be.a('boolean')
					.and.to.be.equal(true)

				expect(json).to.have.property('data')
				expect(json.data).to.have.property('user')
				expect(json.data.user).to.be.a('object')
				userToEdit = json.data.user
			}),
			it(`Should detect missing user in request body`, async () => {
				const userId = userToEdit.id
				let route = ROUTE_EDIT.replace(':userId', userId)
				let json = await util.requestJsonPut(route, { })
				expect(json).to.have.property('ok')
				expect(json.ok).to.be.a('boolean')
					.and.to.be.equal(false)
				expect(json).to.have.property('error')
				expect(json.error).to.be.a('string')
					.and.to.be.equal(`Can't find <user> object in request body`)
			}),
			it(`Should detect invalid user in request body`, async () => {
				const userId = userToEdit.id
				let route = ROUTE_EDIT.replace(':userId', userId)
				let json = await util.requestJsonPut(route, {
					user: "not_an_object"
				})
				expect(json).to.have.property('ok')
				expect(json.ok).to.be.a('boolean')
					.and.to.be.equal(false)
				expect(json).to.have.property('error')
				expect(json.error).to.be.a('string')
					.and.to.be.equal(`object argument is not an object`)
			}),
			it(`Should accept to change firstname to lower case`, async () => {
				const userId = userToEdit.id
				let route = ROUTE_EDIT.replace(':userId', userId)
				userToEdit.firstname = userToEdit.firstname.toLowerCase()
				let json = await util.requestJsonPut(route, {
					user: userToEdit
				})
				expect(json).to.have.property('ok')
				expect(json.ok).to.be.a('boolean').and.to.be.equal(true)

				expect(json).to.have.property('data')
				expect(json.data).to.have.property('user')
				expect(json.data.user).to.be.a('object')

				const editedUser = json.data.user
				expect(editedUser).to.have.property('id')
					.and.to.be.equal(userToEdit.id)

				expect(editedUser).to.have.property('firstname')
					.and.to.be.equal(userToEdit.firstname)
			}),
			it(`Should accept to change firstname to upper case`, async () => {
				const userId = userToEdit.id
				let route = ROUTE_EDIT.replace(':userId', userId)
				userToEdit.firstname = userToEdit.firstname.toUpperCase()
				let json = await util.requestJsonPut(route, {
					user: userToEdit
				})
				expect(json).to.have.property('ok')
				expect(json.ok).to.be.a('boolean').and.to.be.equal(true)

				expect(json).to.have.property('data')
				expect(json.data).to.have.property('user')
				expect(json.data.user).to.be.a('object')
				const editedUser = json.data.user

				expect(editedUser).to.have.property('firstname')
					.and.to.be.equal(userToEdit.firstname)
			})
		})
	})
})

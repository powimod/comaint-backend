const assert = require('assert')
const util = require('./util.js')
var expect = require('chai').expect;

const findUserByEmail= async (email) => {
	assert(email !== undefined)	
	const result = await util.dbRequest("SELECT * FROM users WHERE email = ?", [ email ] )
	if (result.length === 0)
		return null
	return result[0]
}

const findUserById= async (id) => {
	assert(id !== undefined)	
	const result = await util.dbRequest("SELECT * FROM users WHERE id = ?", [ id ] )
	if (result.length === 0)
		return null
	return result[0]
}

const accountPurge = async (email) => {
	const user = await findUserByEmail(email)
	if (user === null)
		return;
	await util.dbRequest("DELETE FROM tokens WHERE id_user = ?", [ user.id ] )
	result = await util.dbRequest("DELETE FROM users WHERE id = ?", [ user.id ] )
	if (result.affectedRows !== 1)
		throw new Error(`Can not delete User ID = ${user.id}`)
}

const login = async (refUser) => {
	const ROUTE_LOGIN = 'api/v1/auth/login'
	let json = await util.requestJsonPost(ROUTE_LOGIN, {
			email: refUser.email,
			password: refUser.password
		})
	if (json.ok === undefined)
		throw new Error("Can't find ok in response");
	if (json.ok === false)
		throw new Error("Register route error : " + json.error);
	if (json.data === undefined)
		throw new Error("Can't find data in response");
	expect(json.data).to.have.property('access-token')
	expect(json.data).to.have.property('refresh-token')
	const user = json.data
	return user
}

const logout = async (refUser) => {
	const ROUTE_LOGOUT = 'api/v1/auth/logout'
	let json = await util.requestJsonPost(ROUTE_LOGOUT, {
			refreshToken: refUser.refreshToken
		})
	if (json.ok === undefined)
		throw new Error("Can't find ok in response");
	if (json.ok === false)
		throw new Error("Logout route error : " + json.error);
}


const declareUser = async (refUser) => {
	let user = await findUserByEmail(refUser.email)
	if (user !==  null) {
		// delete existing tokens
		await util.dbRequest("DELETE FROM tokens WHERE id_user = ?", [ user.id ] )
		await login(refUser)
		return user
	}

	const ROUTE_REGISTER = 'api/v1/auth/register'
	let json = await util.requestJsonPost(ROUTE_REGISTER, {
			email: refUser.email,
			password: refUser.password,
			firstname: refUser.firstname,
			lastname: refUser.lastname
		})
	if (json.ok === undefined)
		throw new Error("Can't find ok in response");
	if (json.ok === false)
		throw new Error("Register route error : " + json.error);
	if (json.data === undefined)
		throw new Error("Can't find data in response");
	const userId = json.data.userId
	if (userId === undefined)
		throw new Error("Can't find user ID in response");

	user = await findUserByEmail(refUser.email)
	if (user === null)
		throw new Error("Can't find user in database");
	const validationCode = user.validation_code
	if (validationCode === undefined)
		throw new Error("Can't find validation code in database");
	if (validationCode === null)
		throw new Error("Validation code not set");

	const ROUTE_VALIDATE = 'api/v1/auth/validateRegistration'
	json = await util.requestJsonPost(ROUTE_VALIDATE, {
			'validationCode': user.validation_code,
		})
	if (json.ok === undefined)
		throw new Error("Can't find ok in response");
	if (json.ok === false)
		throw new Error("Register route error : " + json.error);

	user = await findUserByEmail(refUser.email)
	if (user === null)
		throw new Error("Can't find user in database");
	return user
}


module.exports = {
	findUserByEmail,
	findUserById,
	accountPurge,
	declareUser
}

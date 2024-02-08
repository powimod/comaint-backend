'use strict'
const configFile = './test/selftest-config.json';

const nconf = require('nconf');
const fs = require('fs')
const promise_mysql = require('promise-mysql');

let backendUrl
let dbHost
let dbPort
let dbDatabase
let dbUser
let dbPassword 

const testUser1 = {
	'email': '',
	'password': 'B0ny-P4rc.er',
	'firstname': 'Bonnie',
	'lastname': 'Parker'
}
const testUser2 = {
	'email': '',
	'password': 'B0ny-P4rc.er',
	'firstname': 'Clyde',
	'lastname': 'Barrow'
}

let db = null
let accessToken = null
let refreshToken = null

const sleep = (tempo) => {
	return new Promise( resolve => {
		setTimeout( () =>  { resolve() }, tempo )
	})
}

const loadConfig = () => {
	if (! fs.existsSync(configFile))
		throw new Error(`Can't find file "${configFile}"`)
	nconf.file({ file: configFile });

	backendUrl = nconf.get('backend_url')
	if (backendUrl === undefined)
		throw new Error(`Can't find <backend_url> in file ${configFile}`);

	dbHost = nconf.get('db_host')
	if (dbHost === undefined)
		throw new Error(`Can't find <db_host> in file ${configFile}`);

	dbPort = nconf.get('db_port')
	if (dbPort === undefined)
		throw new Error(`Can't find <db_port> in file ${configFile}`);

	dbDatabase = nconf.get('db_database')
	if (dbDatabase === undefined)
		throw new Error(`Can't find <db_database> in file ${configFile}`);

	dbUser = nconf.get('db_user')
	if (dbUser === undefined)
		throw new Error(`Can't find <db_user> in file ${configFile}`);

	dbPassword = nconf.get('db_password')
	if (dbPassword === undefined)
		throw new Error(`Can't find <db_password> in file ${configFile}`);

	const testEmail1 = nconf.get('test_email_1')
	if (testEmail1 === undefined)
		throw new Error(`Can't find <test_email_1> in file ${configFile}`);
	testUser1.email = testEmail1

	const testEmail2 = nconf.get('test_email_2')
	if (testEmail2 === undefined)
		throw new Error(`Can't find <test_email_2> in file ${configFile}`);
	testUser2.email = testEmail2
}

const requestJsonFull = async (routeUrl, httpMethod, requestBody) => {
	if (backendUrl === undefined)
		loadConfig()
	const url=`${backendUrl}/${routeUrl}`
	const fetchParam = {
		method : httpMethod,
		headers:  {
			'Accept': 'application/json',
			'Content-Type': 'application/json',
			'Accept-Language': 'en, en-US'
		}
	}
	if (httpMethod === 'POST')
		fetchParam.body= JSON.stringify(requestBody)
	if (accessToken !== null) 
		fetchParam.headers['x-access-token'] = accessToken
	const response = await fetch(url, fetchParam);
	if (response.status != 200)
		throw new Error(`Server status ${response.status} (${response.statusText})`);
	const json = await response.json();
	if (json.ok === undefined)
		throw new Error(`Can't find "ok" in server response`)
	if (json.data !== undefined) {
		if (json.data['access-token']) 
			accessToken = json.data['access-token']
		if (json.data['refresh-token']) 
			refreshToken = json.data['refresh-token']
		
	}
	return json
}


const requestJsonGet = async (routeUrl) => {
	return await  requestJsonFull(routeUrl, 'GET')
}

const requestJsonPost = async (routeUrl, body) => {
	return await  requestJsonFull(routeUrl, 'POST', body)
}


const connectDb = async () => {
	db = await promise_mysql.createConnection({
		host: dbHost,
		port: dbPort,
		database: dbDatabase,
		user: dbUser,
		password: dbPassword
	})
	if (db.code) 
		throw new Error(`Can't connect database`)
}

const disconnectDb = async () => {
	if (db === null)
		return
	db.end()
	db = null
}

const dbRequest = async (sqlQuery, sqlValues) => {
	if (db === null)
		await connectDb()
	const result = await db.query(sqlQuery, sqlValues);
	if (result.code) 
		throw new Error(`SQL error : ${result.code}`)
	return result
}

const getAccessToken = () => accessToken  
const getRefreshToken = () => refreshToken  

module.exports = {
	sleep,
	loadConfig,
	requestJsonGet,
	requestJsonPost,
	connectDb,
	disconnectDb,
	dbRequest,
	testUser1,
	testUser2,
	getAccessToken,
	getRefreshToken
}

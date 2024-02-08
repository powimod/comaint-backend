/* Comaint API backend (API server of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * server.js
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the 
 * GNU General Public License as published by the Free Software Foundation; either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied 
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

'use strict';

const fs = require("fs")
const {join} = require('path')
const i18next = require('i18next');
const i18nextMiddleware = require('i18next-http-middleware');
const Backend = require('i18next-fs-backend');

function loadConfig()
{
	const configFile = './config.json';
	console.log(`Loading configuration file ${configFile}`);
	const nconf = require('nconf');
	nconf.argv()
	     .env()
	     .file({ file: configFile });

	const dbParam = nconf.get('database');
	if (dbParam === undefined)
		throw new Error(`Can't find <database> section in configuration file ${configFile}`);
	for (let prop of ['host', 'port', 'user', 'password', 'database' ])
		if (dbParam[prop] === undefined)
			throw new Error(`Can't find <${prop}> property in <database> section of ${configFile}`);

	if (dbParam.pingInterval === undefined)
		dbParam.pingInterval = 60000;
	if (dbParam.reconnection === undefined)
		dbParam.reconnection = {};
	if (dbParam.reconnection.interval === undefined)
		dbParam.reconnection.interval = 1000;
	if (dbParam.reconnection.maxRetries === undefined)
		dbParam.reconnection.maxRetries = 60;

	const serverParam = nconf.get('server');
	if (serverParam === undefined)
		throw new Error(`Can't find <server> section in configuration file ${configFile}`);
	for (let prop of ['host', 'port' ])
		if (serverParam[prop] === undefined)
			throw new Error(`Can't find <${prop}> property in <server> section of ${configFile}`);

	const securityParam = nconf.get('security');
	if (securityParam === undefined)
		throw new Error(`Can't find <security> section in configuration file ${configFile}`);
	for (let prop of ['tokenSecret', 'hashSalt', 'refreshTokenLifespan', 'accessTokenLifespan'])
		if (securityParam[prop] === undefined)
			throw new Error(`Can't find <${prop}> property in <security> section of ${configFile}`);

	const mailParam = nconf.get('mail');
	if (mailParam === undefined)
		throw new Error(`Can't find <mail> section in configuration file ${configFile}`);
	for (let prop of ['host', 'port', 'user', 'password', 'from'])
		if (mailParam[prop] === undefined)
			throw new Error(`Can't find <${prop}> property in <mail> section of ${configFile}`);

	const config = {
		db: dbParam,
		server: serverParam,
		security: securityParam,
		mail: mailParam
	}

	return config;
}


async function main()
{
	const localesDir = join(__dirname, '..', 'locales')
	console.log('Locales directory', localesDir);
	if (! fs.existsSync(localesDir)) 
		throw new Error('Locales directory does not exist');
	await i18next
		.use(Backend)
		.use(i18nextMiddleware.LanguageDetector)
		.init({
			backend: {
				loadPath: `${localesDir}/{{lng}}/{{ns}}.json`,
			},
			detection: {
				order: ['querystring', 'cookie'],
				caches: ['cookie']
			},
			fallbackLng: 'fr',
			preload: ['fr', 'en']
		})
	console.log(i18next.t('general.loading'))

	let config = null;
	config = loadConfig();

	console.log('Initializing model...');
	const ModelSingleton = require('./models/model.js');
	let model  = ModelSingleton.getInstance();
	await model.initialize(config);

	console.log('Initializing view...');
	const ViewSingleton = require('./views/view.js');
	let view = ViewSingleton.getInstance();

	console.log('Initializing controller...');
	const ControllerSingleton = require('./routes/controller.js');
	let controller = ControllerSingleton.getInstance();
	controller.initialize(config, model, view);

	await controller.run();
}

main()
.catch(error =>{
	const message = (error.message) ? error.message : error;
	console.error(`Error : ${message}`);
	process.exit(1);
})

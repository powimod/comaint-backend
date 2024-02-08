/* Comaint API backend (API server of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * util.js
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
const assert = require('assert');

const nodeMailer = require('nodemailer');

exports.sendMail = (mailTo, subject, textBody, htmlBody, conf) => {
	assert(conf !== undefined);
	assert(conf.host !== undefined);
	assert(conf.port !== undefined);
	assert(conf.user !== undefined);
	assert(conf.password !== undefined);
	assert(conf.from !== undefined);

	return new Promise( (resolve, reject) => {
		let transporter = nodeMailer.createTransport({
			host: conf.host,
			port: conf.port,
			secure: false,
			auth: {
				user: conf.user,
				pass: conf.password
			},
			tls: {
				// TODO remove this
				rejectUnauthorized: false
			}
		});
		let mailOptions = {
			from: conf.from,
			to: mailTo, 
			subject: subject,
			text: textBody, // plain text body
			html: htmlBody
		};
		transporter.sendMail(mailOptions, (error, info) => {
			if (error) {
				reject(error);
				return;
			}
			resolve(`Message ${info.messageId} sent: ${info.response}`);
		});
	});
}


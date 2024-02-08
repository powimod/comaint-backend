
var expect = require('chai').expect;
let chai = require('chai');
let chaiHttp = require('chai-http');

const util = require('./helpers/util.js')

describe('Test API root', () => {

	before( () =>  {
		util.loadConfig()
	}),

	describe('Test root', () => {
		it('Control / route', async () => {
			let json = await util.requestJsonGet('')
			expect(json).to.have.property('ok')
			expect(json.ok).to.be.a('boolean')
				.and.to.be.equal(true)
			expect(json).to.have.property('data')
			expect(json.data).to.be.a('string')
				.and.to.be.equal(`API comaint frontend ready`)
		}),
		it('Control /version route', async () => {
			let json = await util.requestJsonGet('version')
			expect(json).to.have.property('ok')
			expect(json.ok).to.be.a('boolean')
				.and.to.be.equal(true)
			expect(json).to.have.property('data')
			expect(json.data).to.be.a('string')
				.and.match(/^\d+\.\d+\.\d+$/)
		})
		it('Control /api/version route', async () => {
			let json = await util.requestJsonGet('api/version')
			expect(json).to.have.property('ok')
			expect(json.ok).to.be.a('boolean')
				.and.to.be.equal(true)
			expect(json).to.have.property('data')
			expect(json.data).to.be.a('string')
				.and.match(/^v\d$/)
		})


	})

})

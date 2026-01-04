import { expect } from 'chai'
import { TextTermConverter } from '../../../../src'

describe('TextTermConverter', () => {
  require('./atomic-term-to-n3')
  require('./symbol-to-n3')
  require('./string-to-n3')
  require('./explicit-uri')
  require('./is-valid-pn-local')

  it('should have keywords reserved', () => {
    expect(TextTermConverter.keywords).to.include('a')
    expect(TextTermConverter.keywords).to.be.an('array')
  })
})

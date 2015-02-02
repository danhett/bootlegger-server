/**
 * Media
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 *
 */

module.exports = {

  attributes: {
  	
  	/* e.g.
  	nickname: 'string'
  	*/
    
  },

  afterCreate:function(newlyInsertedRecord, cb)
  {
  	Log.logModel('Media',newlyInsertedRecord.id);
  	cb();
  },

};
const mongoose2 = require('mongoose');


const availabilitySchema = new mongoose2.Schema({
doctor: { type: mongoose2.Schema.Types.ObjectId, ref: 'User', required: true },
// store ranges per date or weekly template
// date = YYYY-MM-DD for specific date overrides; if empty, it's a weekly template
date: { type: String, default: '' },
// example: [{ start: '10:00', end: '14:00' }, ...]
ranges: [
{
start: { type: String, required: true },
end: { type: String, required: true }
}
],
createdAt: { type: Date, default: Date.now }
});


availabilitySchema.index({ doctor: 1, date: 1 });


module.exports = mongoose2.model('Availability', availabilitySchema);
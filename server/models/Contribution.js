const mongoose = require('mongoose');

const contributionSchema = mongoose.Schema(
  {
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
    },
    paidAmount: {
      type: Number,
      required: true,
      min: [0, 'Paid amount must be >= 0'],
    },
    payDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Contribution', contributionSchema);

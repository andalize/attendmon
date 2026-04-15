const mongoose = require('mongoose');

const choirSessionSchema = mongoose.Schema(
    {
      sessionType: {
        type: String,
        required: true,
      },
      members: [
        {
          member: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Member',
            required: true,
          },
          hasAttended: {
            type: Boolean,
            default: false,
          },
          absenceReason: {
            type: String,
            enum: ['absent_with_permission', 'long_period_permission', 'no_permission', null],
            default: null,
          },
        },
      ],
      sessionDate: {
        type: Date,
        required: true
      }
    },
    { timestamps: true }
  )

module.exports = mongoose.model('ChoirSession', choirSessionSchema);

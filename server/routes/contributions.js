const express = require('express');
const router = express.Router();
const Contribution = require('../models/Contribution');
const Member = require('../models/Member');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// GET home stats: totalPaid & totalUnpaid for a date range
router.get('/contributions/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    const from = fromDate ? new Date(fromDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const to = toDate ? new Date(toDate) : new Date();

    // Count months elapsed in the given range (inclusive)
    const monthsElapsed =
      (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth()) + 1;

    const [members, contributions] = await Promise.all([
      Member.find({ active: true }),
      Contribution.find({ payDate: { $gte: from, $lte: to } }),
    ]);

    const totalPaid = contributions.reduce((sum, c) => sum + c.paidAmount, 0);
    const totalExpected = members.reduce((sum, m) => sum + m.minimumContribution * monthsElapsed, 0);
    const totalUnpaid = Math.max(0, totalExpected - totalPaid);

    res.status(200).json({ totalPaid, totalUnpaid });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET aggregated summary per member for a given year
router.get('/contributions/summary', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12

    const monthsElapsed = year < currentYear ? 12 : (year === currentYear ? currentMonth : 0);

    const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`);
    const endOfYear = new Date(`${year}-12-31T23:59:59.999Z`);

    const [members, contributions] = await Promise.all([
      Member.find({ active: true }),
      Contribution.find({ payDate: { $gte: startOfYear, $lte: endOfYear } }),
    ]);

    // Sum paid per member
    const paidByMember = {};
    contributions.forEach(c => {
      const id = c.memberId.toString();
      paidByMember[id] = (paidByMember[id] || 0) + c.paidAmount;
    });

    const summary = members.map(m => {
      const totalPaid = paidByMember[m._id.toString()] || 0;
      const unPaidAmount = Math.max(0, m.minimumContribution * monthsElapsed - totalPaid);
      return {
        _id: m._id,
        member: { _id: m._id, name: m.name },
        minimumContribution: m.minimumContribution,
        monthsElapsed,
        totalPaid,
        unPaidAmount,
      };
    });

    res.status(200).json(summary);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST — record a new payment for a member
router.post('/contributions', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { memberId, paidAmount, payDate } = req.body.data;

    if (!memberId) return res.status(400).json({ message: 'Member is required.' });

    const contribution = new Contribution({
      memberId,
      paidAmount,
      payDate: payDate || Date.now(),
    });

    await contribution.save();
    res.status(201).json({ message: 'Contribution recorded successfully.' });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const msg = Object.values(error.errors).map(e => e.message).join(', ');
      return res.status(400).json({ message: msg });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PATCH
router.patch('/contributions/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { paidAmount, payDate } = req.body.data;

    const contribution = await Contribution.findById(req.params.id);
    if (!contribution) return res.status(404).json({ message: 'Contribution not found.' });

    if (paidAmount !== undefined) contribution.paidAmount = paidAmount;
    if (payDate) contribution.payDate = new Date(payDate);

    await contribution.save();
    res.status(200).json({ message: 'Contribution updated successfully.' });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const msg = Object.values(error.errors).map(e => e.message).join(', ');
      return res.status(400).json({ message: msg });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE
router.delete('/contributions/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const contribution = await Contribution.findByIdAndDelete(req.params.id);
    if (!contribution) return res.status(404).json({ message: 'Contribution not found.' });
    res.status(200).json({ message: 'Contribution deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

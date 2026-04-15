const express = require('express');
const router = express.Router();
const Member = require('../models/Member');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');


router.post('/members', authMiddleware, adminMiddleware,  async (req, res) => {
    try {


        let { name, phone, email, joinDate } = req.body.data;

        console.log('Type of Email:', typeof req.body.data.email);

        phone = phone?.trim();
        email = email?.trim().toLowerCase();

        if (!name) {
            return res.status(400).json({ message: "Member name is required." });
        }

        const existingMember = await Member.findOne({
            $or: [
                { $and: [{ phone: { $ne: null } }, { phone: phone }] },
                { $and: [{ email: { $ne: null } }, { email: email }] }
            ]
        });

        if (existingMember) {
            return res.status(409).json({ message: "Phone or email already exists." });
        }

        const newMember = new Member({ name, phone, email, joinDate: joinDate || null });

        await newMember.save();

        res.status(201).json({message: 'Success'});
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});


router.post('/members/bulk-insert', async (req, res) => {
    try {

       const members = req.body.members.map(member => {
            return {
                name: member.name,
                phone: member.phone || null,
                email: member.email ? member.email.toLowerCase() : undefined,
                isAdmin: member.isAdmin || false
            };
        });
        await Member.insertMany(members);
        res.status(201).json({ message: 'Members added successfully'});
    } catch (error) {
      res.status(500).json({ message: 'Error saving members', error: error.message });
    }
});


// Get members
router.get('/members', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const members = await Member.find();
        res.status(200).json(members);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update an existing choir member (PATCH for partial update, PUT for full update)
router.patch('/members/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, email, joinDate, minimumContribution } = req.body.data;

        // Find the existing member
        const member = await Member.findById(id);
        if (!member) {
            return res.status(404).json({ message: "Member not found." });
        }

        // Check if the new email or phone already exists in another member
        if (phone || email) {
            const existingMember = await Member.findOne({
                $or: [{ phone }, { email }],
                _id: { $ne: id }, // Exclude the current member
            });

            if (existingMember) {
                return res.status(409).json({ message: "Phone or email already exists." });
            }
        }

        // Update only provided fields
        if (name) member.name = name;
        if (phone) member.phone = phone;
        if (email) member.email = email;
        member.joinDate = joinDate ? new Date(joinDate) : member.joinDate;
        if (minimumContribution !== undefined) member.minimumContribution = minimumContribution;

        await member.save();

        res.status(200).json({ message: "Member updated successfully." });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});


router.delete('/members/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        // Find and delete the member
        const deletedMember = await Member.findByIdAndDelete(id);

        if (!deletedMember) {
            return res.status(404).json({ message: "Member not found." });
        }

        res.status(200).json({ message: "Member deleted successfully." });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});


module.exports = router;

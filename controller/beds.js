const asyncHandler = require('express-async-handler');
const Bed = require('../model/bed');
const logger = require('../logger'); // Assuming the logger is defined in a separate file

/**
 * @swagger
 * tags:
 *   name: Beds
 *   description: API endpoints for managing beds
 */

/**
 * @swagger
 * /adbeds1:
 *   post:
 *     summary: Add beds to a ward
 *     description: Add a specified number of beds to a ward.
 *     tags: [Beds]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               wardName:
 *                 type: string
 *                 description: The name of the ward.
 *               wardId:
 *                 type: string
 *                 description: The ID of the ward.
 *               wardType:
 *                 type: string
 *                 description: The type of the ward.
 *               bedNumber:
 *                 type: integer
 *                 description: The number of beds to add.
 *     responses:
 *       '200':
 *         description: Successfully added beds to the ward.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Added number of beds to the specified ward successfully
 *       '400':
 *         description: Invalid request body or parameters.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Invalid bed count
 *       '500':
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Failed to add beds to the ward
 */
const addBeds = asyncHandler(async (req, res, next) => {
    const { wardName, wardId, wardType, bedNumber } = req.body;

    // Find the existing ward by its wardId and wardType
    let existingWard = await Bed.findOne({
        'wards.wardName': wardName,
        'wards.wardId': wardId,
        'wards.wardType': wardType,
    });

    // If the ward doesn't exist, create a new one
    if (!existingWard) {
        existingWard = new Bed({
            wards: [
                {
                    wardName,
                    wardId,
                    wardType,
                    beds: [],
                },
            ],
        });
    }

    // Get the current bed count in the ward
    const currentBeds = existingWard.wards[0].beds || [];

    if (bedNumber >= 0) {
        // Get the starting bed number
        const startingBedNumber =
            currentBeds.length > 0
                ? parseInt(currentBeds[currentBeds.length - 1].bedNumber.split('_')[1]) + 1
                : 1;

        // Add the specified number of beds to the existing or new ward
        for (let i = 1; i <= bedNumber; i++) {
            const newBedNumber = startingBedNumber + i - 1;
            const newBed = {
                bedNumber: `bed_${newBedNumber}`,
                status: 'available',
            };
            currentBeds.push(newBed);
        }

        // Update the beds array in the existing or newly created ward
        existingWard.wards[0].beds = currentBeds;

        // Save the updated or newly created ward
        await existingWard.save();
        logger.info('added beds successfully'); // Log successful admission

        res.status(200).json({ message: `Added ${bedNumber} beds to the specified ward successfully` });
    }   
    else {
        logger.error('Invalid bed count found'); // Log the error
        return next({ statusCode: 404, message: "Invalid bed count found" });
    }
});
const bedGet = asyncHandler(async (req, res) => {
    const bedss = await Bed.find();
    if (bedss.length > 0) {
        res.json(bedss);
    } else if (bedss.length === 0) {
        res.status(404);
        throw new Error("Invalid Patient Not Found");
    }
  });
module.exports = { addBeds , bedGet};

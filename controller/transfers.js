const asyncHandler = require('express-async-handler');
const Transfer = require('../model/transfer');
const Bed = require('../model/bed');
const logger = require('../logger'); // Assuming the logger is defined in a separate file
const { validationResult } = require('express-validator');

/**
 * @swagger
 * /tpsss:
 *   post:
 *     summary: Transfer a patient between beds
 *     description: Transfer a patient from a current bed to a specified transfer bed within the same or different ward.
 *     tags: [Transfers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentWardId:
 *                 type: string
 *                 description: The ID of the current ward.
 *               currentBedNumber:
 *                 type: string
 *                 description: The number of the current bed.
 *               patientName:
 *                 type: string
 *                 description: The name of the patient.
 *               age:
 *                 type: integer
 *                 description: The age of the patient.
 *               gender:
 *                 type: string
 *                 description: The gender of the patient.
 *               contactno:
 *                 type: string
 *                 description: The contact number of the patient.
 *               patientId:
 *                 type: string
 *                 description: The ID of the patient.
 *               transferWardId:
 *                 type: string
 *                 description: The ID of the ward to transfer the patient to.
 *               transferBedNumber:
 *                 type: string
 *                 description: The number of the bed to transfer the patient to.
 *               medicalAcuity:
 *                 type: string
 *                 description: The medical acuity of the patient.
 *               transferReasons:
 *                 type: string
 *                 description: The reason for the patient transfer.
 *     responses:
 *       '200':
 *         description: Successfully transferred patient.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Patient transfer successful. Transfer bed marked as occupied.
 *       '400':
 *         description: Bad request. Invalid request body or parameters.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Current bed is already available.
 *       '404':
 *         description: Transfer bed is not available.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Transfer bed is not available.
 *       '500':
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Error performing bed action.
 */

// Function to generate a random alphanumeric string of a given length
const generateRandomStrings = (length) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};

// Function to generate a unique patient ID using only a short random string
const generateTransID = () => `TAT-${generateRandomStrings(4)}`; // Adjust the length as needed

const transferPatient = asyncHandler(async (req, res, next) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
  }

   const {
      currentWardId,
      currentBedNumber,
      patientName,
      age,
      gender,
      contactno,
      patientId,
      transferWardId,
      transferBedNumber,
      medicalAcuity,
      transferReasons,
    } = req.body;

    // Automatically generate a unique patient ID
    const transferId = generateTransID();

    // Find the current bed within the current ward
    const currentBed = await Bed.findOne({
      'wards.wardId': currentWardId,
      'wards.beds.bedNumber': currentBedNumber,
    });

    if (!currentBed) {
        const error = new Error("Current bed does not exist in the selected ward");
        return next({ statusCode: 400, message: 'Current bed does not exist in the selected ward.' });
    }

    // Check if the current bed is occupied
    const currentBedIndex = currentBed.wards[0].beds.findIndex(
      (bed) => bed.bedNumber === currentBedNumber && bed.status === 'occupied'
    );

    if (currentBedIndex === -1) {
        const error = new Error("Current bed is already available");
        return next({ statusCode: 400, message: "Current bed is already available" });
    }

    // Find the transfer bed within the transfer ward
    const transferBed = await Bed.findOne({
      'wards.wardId': transferWardId,
      'wards.beds.bedNumber': transferBedNumber,
      'wards.beds.status': 'available',
    });

    if (!transferBed) {
        const error = new Error("Transfer bed not found or not available.");
        return next({ statusCode: 404, message: "Transfer bed not found or not available." });
    }

    // Update the current bed to available
    currentBed.wards[0].beds[currentBedIndex].status = 'available';
    currentBed.wards[0].beds[currentBedIndex].patientId = '';

    // Find the index of the transfer bed within the transfer ward
    const transferBedIndex = transferBed.wards[0].beds.findIndex(
      (bed) => bed.bedNumber === transferBedNumber && bed.status === 'available'
    );

    if (transferBedIndex === -1) {
        const error = new Error("Transfer bed is not available");
        return next({ statusCode: 404, message: "Transfer bed is not available" });
    }

    // Update the transfer bed to occupied with patient information
    transferBed.wards[0].beds[transferBedIndex].status = 'occupied';
    transferBed.wards[0].beds[transferBedIndex].patientId = patientId;

    // Save changes to the database
    await currentBed.save();
    await transferBed.save();

    // Save transfer information to Transfer collection
    const transfer = new Transfer({
      patientName,
      age,
      gender,
      patientId,
      transferId,
      contactno,
      currentWardId,
      currentBedNumber,
      transferWardId,
      transferBedNumber,
      medicalAcuity,
      transferReasons,
    });

    await transfer.save();

    logger.info('Patient transfer successful. Transfer bed marked as occupied.');
    res.status(200).json({ message: 'Patient transfer successful. Transfer bed marked as occupied.' });
});

//get transfer:
const transferGet = asyncHandler(async (req, res) => { 
  const transferBeds = await Transfer.find();
  if (transferBeds.length > 0) {
      res.json(transferBeds);
  } else if (transferBeds.length === 0) {
      res.status(404);
      throw new Error("Invalid Patient Not Found");
  }
});

module.exports = { transferPatient, transferGet };

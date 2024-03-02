const express = require('express');
const router = express.Router();
const moment = require('moment');
const Bed = require('../model/bed');
const Discharged = require('../model/discharge');
const Patient = require('../model/patient');
const asyncHandler = require('express-async-handler');
const logger = require('../logger');

// Function to generate a random alphanumeric string of a given length
const generateDischargeString = (length) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Function to generate a unique discharge ID using only a short random string
const generateDischargeId = () => `Dsh-${generateDischargeString(4)}`; // Adjust the length as needed

/**
 * @swagger
 * /distaa:
 *   post:
 *     summary: Discharge a patient
 *     description: Discharge a patient from a bed in a ward.
 *     tags: [Discharge]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               patientId:
 *                 type: string
 *                 description: The ID of the patient to discharge.
 *               patientName:
 *                 type: string
 *                 description: The name of the patient.
 *               medicalAcuity:
 *                 type: string
 *                 description: The medical acuity of the patient.
 *               age:
 *                 type: integer
 *                 description: The age of the patient.
 *               gender:
 *                 type: string
 *                 description: The gender of the patient.
 *               admissionDate:
 *                 type: string
 *                 format: date
 *                 description: The date of admission.
 *               wardId:
 *                 type: string
 *                 description: The ID of the ward.
 *               bedNumber:
 *                 type: string
 *                 description: The number of the bed.
 *               dischargeReasons:
 *                 type: string
 *                 description: The reason for discharge.
 *               dischargeDate:
 *                 type: string
 *                 format: date
 *                 description: The date of discharge.
 *               dischargeTime:
 *                 type: string
 *                 format: time
 *                 description: The time of discharge.
 *     responses:
 *       '200':
 *         description: Patient discharged successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Patient discharged and bed record updated successfully.
 *                 mortalityRate:
 *                   type: number
 *                   format: float
 *                   example: 3.45
 *       '400':
 *         description: Bad request. Patient is already discharged.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Patient is already discharged.
 *       '404':
 *         description: Ward or bed not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Ward not found.
 *       '500':
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Error discharging patient and updating bed record.
 */

// Function to discharge a patient
const dischargePatient = asyncHandler(async (req, res,next) => {
  const {
    patientId,
    patientName,
    medicalAcuity,
    age,
    gender,
    admissionDate,
    wardId,
    bedNumber,
    dischargeReasons,
    dischargeDate,
    dischargeTime
  } = req.body;

  // Automatically generate a unique discharge ID
  const dischargeId = generateDischargeId();

  // Find the bed within the ward
  const bedData = await Bed.findOne({ 'wards.wardId': wardId });

  if (!bedData) {
    logger.error('Ward not found.');
    return res.status(404).json({ error: 'Ward not found.' });
  }

  // Find the specific bed within the ward
  const selectedBed = bedData.wards
    .find((w) => w.wardId === wardId)
    .beds.find((b) => b.bedNumber === bedNumber);

  // Logging for debugging
  logger.debug('Bed Data:', bedData);
  logger.debug('Selected Bed:', selectedBed);

  // Check if patient is occupying the bed and is not already discharged
  if (selectedBed && selectedBed.status === 'occupied' && selectedBed.patientId === patientId) {
    // Check if patient is already discharged
    const isAlreadyDischarged = await Discharged.exists({ patientId });

    if (isAlreadyDischarged) {
      logger.error('Patient is already discharged.');
      return res.status(400).json({ error: 'Patient is already discharged.' });
    }

    // Update bed record
    selectedBed.status = 'available';
    selectedBed.patientId = '';
    // selectedBed.patientName = '';
    // selectedBed.age = '';
    // selectedBed.contactno = '';
    // selectedBed.gender = '';
    // selectedBed.medicalAcuity = '';

    // Save the updated bed record
    await bedData.save();

    // Calculate mortality rate (example calculation, adjust as needed)
    const totalBedsInWard = bedData.wards.reduce((total, ward) => total + ward.beds.length, 0);
    const dischargedRecords = await Discharged.find({ 'dischargeReasons': 'died' });
    const totalDiedCases = dischargedRecords.length;
    const mortalityRate = (totalDiedCases / totalBedsInWard) * 100;

    // Delete patient record from the patients collection
    await Patient.deleteOne({ patientId });

    // Log the calculated mortality rate
    logger.info('Calculated Mortality Rate:', mortalityRate);

    // Create a discharged record with all the data fields
    const discharged = new Discharged({
      dischargeId,
      patientName,
      age,
      gender,
      medicalAcuity,
      admissionDate,
      wardId,
      bedNumber,
      dischargeReasons,
      dischargeDate,
      dischargeTime,
      mortalityRate,
    });

    // Save the discharged record
    await discharged.save();

    logger.info('Patient discharged and bed record updated successfully.');
    res.status(200).json({ message: 'Patient discharged and bed record updated successfully.', mortalityRate });
  } else {
    logger.error('Patient is not occupying the bed or already discharged.');
    res.status(400).json({ error: 'Patient is not occupying the bed or already discharged.' });
  }
});


module.exports = { dischargePatient };

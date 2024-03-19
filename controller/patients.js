const asyncHandler = require('express-async-handler');
const moment = require('moment')
const Patient = require('../model/patient')
const Bed = require('../model/bed')
const { validationResult } = require('express-validator');
const logger = require('../logger'); // Assuming the logger is defined in a separate file

/**
 * @swagger
 * components:
 *   schemas:
 *     Address:
 *       type: object
 *       properties:
 *         doorno:
 *           type: string
 *           description: The door number of the address.
 *         streetname:
 *           type: string
 *           description: The street name of the address.
 *         district:
 *           type: string
 *           description: The district of the address.
 *         state:
 *           type: string
 *           description: The state of the address.
 *         country:
 *           type: string
 *           description: The country of the address.
 *         pincode:
 *           type: string
 *           description: The pin code of the address.
 *
 *     Task:
 *       type: object
 *       properties:
 *         taskType:
 *           type: string
 *           description: The type of task.
 *         description:
 *           type: string
 *           description: The description of the task.
 *
 *     Patient:
 *       type: object
 *       properties:
 *         patientName:
 *           type: string
 *           description: The name of the patient.
 *         age:
 *           type: integer
 *           description: The age of the patient.
 *         gender:
 *           type: string
 *           description: The gender of the patient.
 *         contactno:
 *           type: string
 *           description: The contact number of the patient.
 *         wardId:
 *           type: string
 *           description: The ID of the ward.
 *         wardName:
 *           type: string
 *           description: The name of the ward.
 *         bedNumber:
 *           type: string
 *           description: The number of the bed.
 *         medicalAcuity:
 *           type: string
 *           description: The medical acuity of the patient (Critical, Moderate, Stable).
 *         admittingDoctors:
 *           type: string
 *           description: The name of the admitting doctor.
 *         admissionDate:
 *           type: string
 *           format: date
 *           description: The date of admission (DD-MM-YYYY).
 *         admissionTime:
 *           type: string
 *           format: time
 *           description: The time of admission (HH:MM).
 *         assignedNurse:
 *           type: string
 *           description: The name of the assigned nurse.
 *         tasks:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Task'
 *           description: The tasks assigned to the patient.
 *         address:
 *           $ref: '#/components/schemas/Address'
 *         abhaNo:
 *           type: string
 *           description: The ABHA number of the patient.
 *         infectionStatus:
 *           type: string
 *           description: The infection status of the patient.
 *       required:
 *         - patientName
 *         - age
 *         - gender
 *         - contactno
 *         - wardId
 *         - wardName
 *         - bedNumber
 *         - medicalAcuity
 *         - admittingDoctors
 *         - admissionDate
 *         - admissionTime
 *         - assignedNurse
 *         - address
 *         - abhaNo
 *         - infectionStatus
 */

/**
 * @swagger
 * /admitpt:
 *   post:
 *     summary: Admit a patient
 *     description: Add a new patient to the system and update bed status.
 *     tags: [Patient]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Patient'
 *     responses:
 *       '201':
 *         description: Successfully admitted patient.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 patient:
 *                   $ref: '#/components/schemas/Patient'
 *                 infectionRate:
 *                   type: number
 *                   description: The current infection rate.
 *       '400':
 *         description: Invalid request body or parameters.
 *       '500':
 *         description: Server error.
 */


//Generate Unique Patient Id Function for Admit Patient
const generateRandomString = (length) => {
    const characters = 'ABCDEF1234';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };
  
  // Function to generate a unique patient ID using only a short random string
  const generatePatientID = () => `PAT-${generateRandomString(4)}`; // Adjust the length as needed
  
  // Function to calculate the risk score based on medical acuity
  function calculateRiskScore(medicalAcuity) {
    switch (medicalAcuity) {
      case "Critical":
        return 0.85;
      case "Moderate":
        return 0.65;
      case "Stable":
        return 0.45;
      default:
        return 0.1; // Default risk score for unknown or unassigned medical acuity
    }
  }
  
  // Function to calculate infection rate
  async function calculateInfectionRate() {
    try {
      const totalAdmittedPatients = await Patient.countDocuments();
      const infectedPatients = await Patient.countDocuments({ infectionStatus: 'infected' });
      if (totalAdmittedPatients === 0) {
        return 0;
      }
      return (infectedPatients / totalAdmittedPatients) * 100;
    } catch (error) {
      console.error('Failed to calculate infection rate', error);
      throw error;
    }
  }
  
  // Global variable to store readmitted patient contact numbers
  const readmittedPatients = new Set();
  
 
// POST endpoint to admit a patient with readmission rate calculation
const admitPatient = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
  }

  const {
      patientName, age, gender, contactno, wardId, wardName, bedNumber, medicalAcuity,
      admittingDoctors, admissionDate, admissionTime, assignedNurse, tasks,
      address, abhaNo, infectionStatus,
  } = req.body;

  // Calculate risk score based on medical acuity
  const riskScore = calculateRiskScore(medicalAcuity);

  // Ensure admissionDate is today or in the future
  const now = moment().startOf('day');
  const selectedDate = moment(admissionDate, 'DD-MM-YYYY').startOf('day');

  if (!selectedDate.isValid() || selectedDate.isBefore(now)) {
      const error = new Error("Admission date must be a valid date and today or a future date");
      return next({ statusCode: 400, message: "Invalid admission date" }); // Pass error to next middleware with status code 404
  }

  // Check if the patient has been readmitted based on contact number
  const readmitted = readmittedPatients.has(contactno);

  // Automatically generate a unique patient ID
  const patientId = generatePatientID();

  // Create a new Patient document with readmission flag
  const newPatient = new Patient({
      patientName, age, gender, contactno, wardId, patientId, wardName, bedNumber,
      medicalAcuity, admittingDoctors, admissionDate, admissionTime,
      assignedNurse, abhaNo, address, tasks, riskScore, infectionStatus, readmitted,
  });

  // Check if the specified ward and bed exist
  const bed = await Bed.findOne({
      'wards.wardId': wardId,
      'wards.beds.bedNumber': bedNumber
  });
  if (!bed) {
      const error = new Error("Ward or bed does not exist");
      logger.error('Ward or bed does not exist', { error: error.message }); // Log the error
      return next({ statusCode: 404, message: "Ward or bed does not exist" }); // Pass error to next middleware with status code 404
  }
  // Check if the bed is available
  const selectedBed = bed.wards.find(wardItem => wardItem.wardId === wardId).beds.find(bedItem => bedItem.bedNumber === bedNumber);

  if (selectedBed.status === 'occupied') {
      const error = new Error("Selected bed is already occupied.");
      return next({ statusCode: 404, message: "Selected bed is already occupied" }); // Pass error to next middleware with status code 404
  }

  // Save the patient
  const savedPatient = await newPatient.save();

  // Mark the bed as occupied in the bed collection
  selectedBed.status = 'occupied';
  selectedBed.patientId = patientId;

  // Save changes to the bed data
  await bed.save();

  // Add the contact number to the readmittedPatients set
  readmittedPatients.add(contactno);

  // Calculate infection rate
  const infectionRate = await calculateInfectionRate();

  logger.info('Patient admitted successfully'); // Log successful admission

  res.status(201).json({ patient: savedPatient, infectionRate });
});

//patient get:
const PatientGet = asyncHandler(async (req, res) => {
  const PatientBeds = await Patient.find();
  if (PatientBeds.length > 0) {
      res.json(PatientBeds);
  } else if (PatientBeds.length === 0) {
      res.status(404);
      throw new Error("Invalid Patient Not Found");
  }
});

module.exports = { admitPatient,PatientGet };
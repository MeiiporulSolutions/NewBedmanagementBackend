const asyncHandler = require('express-async-handler');
const Waiting = require('../model/waiting');
const Patient = require('../model/patient');
const Bed = require('../model/bed')
const moment = require('moment');
const logger = require('../logger');

const generateRandomString = (length) => {
    const characters = 'ABCDEF1234';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};

const genPatientID = () => `PAT-${generateRandomString(4)}`;

const addWaitingEntry = asyncHandler(async (req, res, next) => {

       const { patientName, contactno, medicalAcuity, admittingDoctors, wardId, wardName, bedNumber, priority, age, gender, admissionDate, admissionTime, assignedNurse, address, tasks, abhaNo } = req.body;

        // Ensure admissionDate is today or in the future
        const now = moment().startOf('day');
        const selectedDate = moment(admissionDate, 'DD-MM-YYYY').startOf('day');

        if (!selectedDate.isValid() || selectedDate.isBefore(now)) {
        const error = new Error("Admission date must be a valid date and today or a future date");
        return next({ statusCode: 400 , message: "Invalid admission date"}); // Pass error to next middleware with status code 404

        }

        const patientId = genPatientID();

        const newEntry = {
            WaitlistEntryfields: [{
                patientName,
                patientId,
                contactno,
                medicalAcuity,
                wardId,
                bedNumber,
                wardName,
                priority,
                age,
                gender,
                admittingDoctors,
                admissionDate,
                admissionTime,
                assignedNurse,
                address,
                tasks,
                abhaNo
            }]
        };

        const createdEntry = await Waiting.create(newEntry);

        const newPatient = {
            patientName,
            patientId,
            contactno,
            age,
            gender,
            wardId,
            priority,
            wardName,
            bedNumber,
            admittingDoctors,
            admissionDate,
            admissionTime,
            assignedNurse,
            address,
            tasks,
            abhaNo
        };

        await Patient.create(newPatient);
        logger.info('New entry created in waiting list', { patientId });
        res.status(201).json({ createdEntry });

});

//Priority Update
const PriorityUpdate = asyncHandler(async(req,res)=>{

    const{patientId,priority} = req.body
    const wait = await Waiting.findOneAndUpdate({ 'WaitlistEntryfields.patientId': patientId },{$set:{'WaitlistEntryfields.$.priority': priority }});

    if (!wait) {
      const error = new Error("Patient not found in the waiting list.")
      res.status(400)
      throw error
    }

    res.json({ message: 'Priority assigned successfully.'});

})

const BedAssignUpdate = asyncHandler(async (req, res) => {
    const { bedNumber, patientId } = req.body;
  
    if (!patientId) {
      const error = new Error("PatientId is required");
      res.status(400);
      throw error;
    }
  
    try {
      // Find the bed in the Bed collection
      let existingBed = await Bed.findOne({ 'wards.beds.bedNumber': bedNumber });
  
      if (!existingBed) {
        // Create new record if bed doesn't exist
        const newBed = new Bed({
          wards: [{
            beds: [{
              bedNumber,
              status: 'occupied',
              patientId
            }]
          }]
        });
  
        // Save the newBed
        await newBed.save();
  
        // Update the bedNumber in the Patient collection
        await Patient.updateOne({ _id: patientId }, { $set: { bedNumber, status: 'occupied' } });
  
        return res.json({ message: 'Bed assignment updated successfully.' });
      }
  
      // Check if the bed is available
      const availableBed = existingBed.wards.some((ward) => {
        return ward.beds.some((bed) => bed.bedNumber === bedNumber && bed.status === 'available');
      });
  
      if (!availableBed) {
        return res.status(400).json({ message: 'Bed is already occupied.' });
      }
  
      // Update existing record
      existingBed.wards.forEach((ward) => {
        const bedToUpdate = ward.beds.find((bed) => bed.bedNumber === bedNumber && bed.status === 'available');
        if (bedToUpdate) {
          bedToUpdate.status = 'occupied';
          bedToUpdate.patientId = patientId;
        }
      });
  
      // Save the changes to the existingBed
      await existingBed.save();
  
      // Update the bedNumber in the Patient collection
      await Patient.updateOne({ _id: patientId }, { $set: { bedNumber, status: 'occupied' } });
  
      res.json({ message: 'Bed assignment updated successfully.' });
    } catch (error) {
      // Handle any errors
      console.error(error);
      res.status(500).json({ message: 'Internal server error.' });
    }
  });
  
//Wait Get
const WaitGet = asyncHandler(async(req,res)=>{
   const wait = await Waiting.find({},'-_id WaitlistEntryfields.patientName WaitlistEntryfields.patientId WaitlistEntryfields.age WaitlistEntryfields.gender WaitlistEntryfields.priority WaitlistEntryfields.admittingDoctors WaitlistEntryfields.admissionDate')
   
   if (wait.length > 0) {
    res.json(wait);
} else if (wait.length === 0) {
    res.status(404);
    throw new Error("Invalid Patient Not Found");
}
})
module.exports = { addWaitingEntry,PriorityUpdate,BedAssignUpdate,WaitGet};

const asyncHandler = require('express-async-handler');
const Waiting = require('../model/waiting');
const Patient = require('../model/patient');
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

const addWaitingEntry = asyncHandler(async (req, res) => {
    try {
        const { patientName, contactno, medicalAcuity, admittingDoctors, wardId, wardName, bedNumber, priority, age, gender, admissionDate, admissionTime, assignedNurse, address, tasks, abhaNo } = req.body;

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

        const createdPatient = await Patient.create(newPatient);
        logger.info('New entry created in waiting list', { patientId });
        res.status(201).json({ createdEntry });
    } catch (error) {
        logger.error('Failed to create entry in waiting list', { error: error.message });
        res.status(500).json({ error: 'Failed to create entry', details: error.message });
    }
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

// Assign Bed
const BedAssignUpdate = asyncHandler(async (req, res) => {
  const { bedNumber, patientId } = req.body;

  if (!patientId) {
    const error = new Error("PatientId is required");
    res.status(404);
    throw error;
  }

  // Find the bed in the Bed collection
  let existingBed = await Bed.findOne({ 'wards.beds.bedNumber': bedNumber });

  if (existingBed) {
    // Update existing record
    existingBed.wards.forEach((ward) => {
      const bedToUpdate = ward.beds.find((bed) => bed.bedNumber === bedNumber);
      if (bedToUpdate) {
        bedToUpdate.status = 'occupied';
        bedToUpdate.patientId = patientId;
      }
    });

    // Save the changes to the existingBed
    await existingBed.save();
  } else {
    // Create new record
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
  }

  // Update the bedNumber in the Patient collection
  await Patient.updateOne({ patientId }, { $set: { bedNumber, status: 'occupied' } });

  res.json({ message: 'Bed assignment updated successfully.' });
});

//Wait Get
const WaitGet = asyncHandler(async(req,res,next)=>{
   const wait = await Waiting.find({},'-_id WaitlistEntryfields.patientName WaitlistEntryfields.age WaitlistEntryfields.gender WaitlistEntryfields.priority WaitlistEntryfields.admittingDoctors WaitlistEntryfields.admissionDate')
   
   if(!wait){
    const Error = new Error("Patient Not Found")
    res.status(400)
    throw error
   }
  
   res.status(201).json(wait)
})
module.exports = { addWaitingEntry,PriorityUpdate,BedAssignUpdate,WaitGet };

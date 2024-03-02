const mongoose = require('mongoose');

const dischargeSchema = new mongoose.Schema({
    patientName: String,
    age: String,
    dischargeId:String,
    gender: String,
    dischargeId:String,
    patientId: String,
    admissionDate: String,
    dischargeDate: String,
    dischargeTime: String,
    mortalityRate: {
      type: Number,
    },
    wardId: {
      type: String,
      required: true,
    },
    wardName: String,
    bedNumber: {
      type: String,
    },
    medicalAcuity: [
      {
        type: String,
        required: true,
      },
    ],
    dischargeReasons: [
      {
        type: String,
        required: true,
      },
    ],
   
    
    
  });
  
  const Discharged = mongoose.model('Discharge', dischargeSchema);
  module.exports = Discharged;
  
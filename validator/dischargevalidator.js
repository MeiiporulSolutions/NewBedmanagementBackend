const {body} = require('express-validator')

const dischargePatientValidationRules = () =>{
    return[
        body('patientName').notEmpty().withMessage('PatientName is required'),
        body('age').notEmpty().isInt().withMessage('Age is required'),
        body('gender').notEmpty().withMessage('Gender is required'),
        body('contactno').notEmpty().isInt().withMessage('Contactno is required'),
        body('patientId').notEmpty().withMessage('PatientId is required'),
        body('wardId').notEmpty().withMessage('WardId is required'),
        body('admissionDate').notEmpty().withMessage('Admission Date is required'),
        body('bedNumber').notEmpty().withMessage('BedNumber is required'),
        body('dischargeDate').notEmpty().withMessage('Discharge Date is required'),
        body('dischargeTime').notEmpty().withMessage('DischargeTime is required'),
        body('medicalAcuity').notEmpty().withMessage('MedicalAcuity is required'),
        body('dischargeReasons').notEmpty().withMessage('TransferReasons is required')

      
    ]
}

module.exports = { 
dischargePatientValidationRules 
}
const {body} = require('express-validator')

const transferPatientValidationRules = () =>{
    return[
        body('patientName').notEmpty().withMessage('PatientName is required'),
        body('age').notEmpty().isInt().withMessage('Age is required'),
        body('gender').notEmpty().withMessage('Gender is required'),
        body('contactno').notEmpty().isInt().withMessage('Contactno is required'),
        body('patientId').notEmpty().withMessage('PatientId is required'),
        body('transferWardId').notEmpty().withMessage('Transfer wardId is required'),
        body('transferBedNumber').notEmpty().withMessage('Transfer BedNumber is required'),
        body('currentWardId').notEmpty().withMessage('Current wardId is required'),
        body('currentBedNumber').notEmpty().withMessage('Current BedNumber is required'),
        body('medicalAcuity').notEmpty().withMessage('MedicalAcuity is required'),
        body('transferReasons').notEmpty().withMessage('TransferReasons is required')

      
    ]
}

module.exports = { 
    transferPatientValidationRules 
}
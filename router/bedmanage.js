const express = require('express');
const router = express.Router();
const { addBeds,bedGet } = require('../controller/beds');
const { admitPatient,PatientGet}=require('../Patient/patient');
const { admitPatientValidationRules } = require('../validator/admitvalidator');
const { transferPatientValidationRules } = require('../validator/transfervalidator');
const { dischargePatientValidationRules } = require('../validator/dischargevalidator')
const { transferPatient,transferGet } = require('../controller/transfers');

const { dischargePatient } = require('../controller/discharges');
const { paagHandler, wardOccup, availablebed,bedAvailabilityBoard,getAdmissionDischarge}=require('../dashboard/dash')
const {patientCare}=require('../dashboard/dash')
const {Dash7,Dash8,Dash9,Dash10,Dash11,Dash12} = require('../dashboard/dashlast')
const {addWaitingEntry,PriorityUpdate,BedAssignUpdate,WaitGet} = require('../controller/waiting')

// POST endpoint to add beds
router.post('/adbeds1', addBeds);
//admit router:
router.post('/admitpt', admitPatientValidationRules(), admitPatient);
//transfer router:
router.post('/tpsss',transferPatientValidationRules(), transferPatient);
//discharge:
router.post('/distaa',dischargePatientValidationRules(), dischargePatient);

//get method of patient:
router.get('/patientGet',PatientGet)
router.get('/bedGet', bedGet)
router.get('/transferGet', transferGet)

//dashboard2:
router.get('/wardoccupancys',wardOccup)

//dashboard3:
router.get('/realtimeavail',availablebed)

//dashboard4:

router.get('/paaG', paagHandler)

//dashbpard 5:
router.get('/admdis', getAdmissionDischarge)
//dashboard 6:
router.get('/patientCareDashboard', patientCare)
//dashboard 1:
router.get('/availbilityboard', bedAvailabilityBoard)
//Dash 7:
router.get('/risk', Dash7)

//dashboard 8:
router.get('/bedturnaroundtimes', Dash8)
//dashboard 9:
router.get('/:wardId/statistics',Dash9)
//Dashboard 10:
router.get('/patientflow',Dash10)

//dash11:
router.get('/patient',Dash11)
//Dashboard 12:
router.get('/paces',Dash12)

//waiting:
router.post('/waitingentry1',addWaitingEntry)
//Priority
router.put('/pro',PriorityUpdate)

//Bedassign
router.put('/assignbedss',BedAssignUpdate)

//WaitGet
router.get('/Waiting',WaitGet)

module.exports = router;

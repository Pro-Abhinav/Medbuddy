var express = require("express");
var router = express.Router();
var ObjectId = require("mongodb").ObjectID;
const Doctor = require("../models/docSchema");
const User = require("../models/userSchema");
const Appointment = require("../models/appointmentSchema");
const PatientHistory = require("../models/patientHistorySchema");

const sendPrescriptionMail = require("../public/jsFiles/mail");
const DoctorStats = require("../models/statsSchema/doctorStatsSchema");
const PatientStats = require("../models/statsSchema/patientStatsSchema");
////+++////

//Doctor routes

router.get("/generatePresc/:id", function (req, res) {
  User.findById(req.params.id, function (err, foundPatient) {
    if (err) {
      console.log(err);
      req.flash("error", "Something went wrong");
      res.redirect("/userDocSection/patientList");
    } else {
      console.log(foundPatient._id, "yeah");
      User.find({ _id: ObjectId(req.user._id) }).exec(function (
        err,
        doctorDetails
      ) {
        if (err) {
          console.log(err);
        } else {
          Doctor.find({ handler_id: ObjectId(req.user._id) }).exec(function (
            err,
            doctorProfessionalDetails
          ) {
            if (err) {
              console.log(err);
            } else {
              res.render("userDocSection/docfiles/prescription", {
                foundPatient: foundPatient,
                doctorDetails: doctorDetails,
                date: Date(),
                prescriptionNo: Date.now(),
                doctorProfessionalDetails: doctorProfessionalDetails,
              });
            }
          });
        }
      });
    }
  });
});
router.get("/userDocSection/doctor/createProfile", function (req, res) {
  res.render("userDocSection/docfiles/profile");
});

router.get("/userDocSection/patientList", function (req, res) {
  Doctor.find(
    { handler_id: ObjectId(req.user._id) },
    { _id: 1 },
    function (err, foundDocId) {
      if (err) {
        console.log(err);
        req.flash("error", "No Patient Found");
        res.redirect("/userDocSection/docDashboard");
      } else {
        Appointment.find({ docId: ObjectId(foundDocId[0]._id) })
          .populate("patientId")
          .exec(function (err, foundPatients) {
            if (err) {
              console.log(err);
            } else {
              res.render("userDocSection/docfiles/patientList", {
                patients: foundPatients,
              });
            }
          });
      }
    }
  );
});

router.get("/userDocSection/patientList/patientInfo/:id", function (req, res) {
  User.findById(req.params.id, function (err, foundPatient) {
    if (err) {
      console.log(err);
      req.flash("error", "Something went wrong");
      res.redirect("/userDocSection/patientList");
    } else {
      Doctor.find(
        { handler_id: ObjectId(req.user._id) },
        { _id: 1 },
        function (err, foundDocId) {
          if (err) {
            console.log(err);
            req.flash("error", "No Patient Found");
            res.redirect("/userDocSection/docDashboard");
          } else {
            PatientHistory.find({
              handlerId: req.params.id,
              appointedDoctorId: foundDocId[0]._id,
            }).exec(function (err, foundPatientMedicalRecords) {
              if (err) {
                console.log(err);
              } else {
                res.render("userDocSection/docfiles/patientInfo", {
                  foundPatient: foundPatient,
                  foundPatientMedicalRecords: foundPatientMedicalRecords,
                });
              }
            });
          }
        }
      );
    }
  });
});

router.get("/userDocSection/reports/:id", function (req, res) {
  res.render("userDocSection/reports");
});

router.post("/sendEmail", (req, res) => {
  const Data = {
    name: req.body.name,
    email: req.body.email,
    subject: req.body.subject,
    text: req.body.text,
  };

  sendMail(
    Data.name,
    Data.email,
    Data.subject,
    Data.text,
    function (err, data) {
      if (err) {
        res.status(500).json({ message: "Internal Error" });
      } else {
        res.redirect("/userDocSection/patientInfo");
        res.status({ message: "Email sent!!!" });
      }
    }
  );
});

router.get("/userDocSection/consultDoc/presc", function (req, res) {
  res.render("userDocSection/docfiles/prescription");
});

// -------------Doctor Profile Post Routes ------------------//

router.post("/userDocSection/createProfile", function (req, res) {
  let newDocPro = {
    speciality: req.body.speciality,
    workingAt: req.body.workingAt,
    workAtHosp: req.body.workAtHosp,
    timing: {
      timingFrom: req.body.timingFrom,
      timingTo: req.body.timingTo,
    },
    qual: req.body.qual,
    experience: req.body.experience,
    handler_id: req.user._id,
  };

  Doctor.create(newDocPro, function (err, newProfessionalDoc) {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/userDocSection/docDashboard");
    }
  });
});

////+++////

//patient routes

//all doctors
router.get("/userDocSection/docList/", function (req, res) {
  Doctor.find()
    .populate("handler_id", "firstName lastName")
    .exec(function (err, foundDoctors) {
      if (err) {
        console.log(err);
      } else {
        PatientHistory.find()
          .where("handlerId")
          .equals(req.user._id)
          .select("currentDoctorId")
          .exec(function (error, foundHistory) {
            if (error) console.log(error);
            else {
              res.render("userDocSection/patientfiles/docList", {
                doctors: foundDoctors,
                patientHistory: foundHistory,
              });
            }
          });
      }
    });
});

router.get("/userDocSection/docList/docInfo/:id", function (req, res) {
  Doctor.findById(req.params.id)
    .populate("handler_id")
    .exec(function (err, foundDoctor) {
      if (err) {
        console.log(err);
      } else {
        res.render("userDocSection/patientfiles/takeAppointment", {
          doctors: foundDoctor,
        });
      }
    });
});

//my doctor

router.get("/userDocSection/myAppointments", function (req, res) {
  Appointment.find({})
    .where("patientId")
    .equals(req.user._id)
    .populate({
      path: "docId",
      select: "speciality",
      populate: { path: "handler_id", select: "firstName lastName" },
    })
    .exec(function (err, foundAppointments) {
      if (err) {
        console.log(err);
      } else {
        res.render("userDocSection/patientfiles/myAppointments", {
          foundAppointments: foundAppointments,
        });
      }
    });
});

router.get("/userDocSection/myAppointments/show", function (req, res) {});

//book appointment button

router.post("/userDocSection/createAppointment/:docId", function (req, res) {
  var emergency = false;
  if (req.body.emergency != undefined) {
    emergency = true;
  }
  let newAppointment = {
    patientId: req.user._id,
    docId: req.params.docId,
    phone: req.body.phone,
    slot: req.body.preferSlot,
    disease: req.body.disease,
    selectedSlot: req.body.selectedSlot,
    isEmergency: emergency,
  };
  const dynamicSlotkey = "availableSlots." + req.body.selectedSlot;

  Doctor.find(
    { _id: ObjectId(req.params.docId) },
    { [dynamicSlotkey]: 1 }
  ).exec(function (err, checkAvailableSlots) {
    if (err) {
      console.log(err);
    } else {
      if (
        checkAvailableSlots[0]["availableSlots"][req.body.selectedSlot] == 0
      ) {
        console.log("This Slot is Already full");
        req.flash("error", "This Slot is Already full");
        res.redirect(`/userDocSection/docList/docInfo/${req.params.docId}`);
      } else {
        Appointment.create(newAppointment, function (err, createAppointment) {
          if (err) console.log(err);
          else {
            if (
              req.user.appointedDoctors &&
              req.user.appointedDoctors.includes(req.params.docId)
            ) {
              PatientHistory.findOne(
                {
                  handlerId: req.user._id,
                  appointedDoctorId: req.params.docId,
                },
                function (error, foundHistory) {
                  if (error) {
                    console.log(error);
                  } else {
                    User.findByIdAndUpdate(
                      req.user._id,
                      { $push: { currentDoctors: req.params.docId } },
                      function (er, updatedUser) {
                        if (er) {
                          console.log(er);
                        } else {
                          if (req.body.selectedSlot == "slotA") {
                            console.log(req.body.selectedSlot, "entered");
                            Doctor.updateOne(
                              { _id: ObjectId(req.params.docId) },
                              { $inc: { "availableSlots.slotA": -1 } },
                              { new: true }
                            ).exec(function (err, result) {
                              if (err) {
                                console.log(err);
                              } else {
                                console.log("Success", result);
                                res.redirect(
                                  "/userDocSection/patientDashboard"
                                );
                              }
                            });
                          } else {
                            console.log(
                              req.body.selectedSlot,
                              "entered22222222222"
                            );

                            Doctor.updateOne(
                              { _id: ObjectId(req.params.docId) },
                              { $inc: { "availableSlots.slotB": -1 } },
                              { new: true }
                            ).exec(function (err, result) {
                              if (err) {
                                console.log(err);
                              } else {
                                console.log("newsuc", result);
                                res.redirect(
                                  "/userDocSection/patientDashboard"
                                );
                              }
                            });
                          }
                        }
                      }
                    );
                  }
                }
              );
            } else {
              let defaultPatientHistory = {
                handlerId: req.user._id,
                appointedDoctorId: req.params.docId,
                prescription: [
                  {
                    date: Date.now(),
                  },
                ],
              };
              PatientHistory.create(
                defaultPatientHistory,
                function (error, defaultHistory) {
                  if (error) {
                    console.log(error);
                  } else {
                    console.log("doc unregistered");
                    User.findOneAndUpdate(
                      { _id: req.user._id },
                      {
                        $push: {
                          appointedDoctors: req.params.docId,
                          currentDoctors: req.params.docId,
                        },
                      },
                      function (er, updatedUser) {
                        if (er) {
                          console.log(er);
                        } else {
                          if (req.body.selectedSlot == "slotA") {
                            Doctor.updateOne(
                              { _id: ObjectId(req.params.docId) },
                              { $inc: { "availableSlots.slotA": -1 } },
                              { new: true }
                            ).exec(function (err, result) {
                              if (err) {
                                console.log(err);
                              } else {
                                res.redirect(
                                  "/userDocSection/patientDashboard"
                                );
                              }
                            });
                          } else {
                            Doctor.updateOne(
                              { _id: ObjectId(req.params.docId) },
                              { $inc: { "availableSlots.slotB": -1 } },
                              { new: true }
                            ).exec(function (err, result) {
                              if (err) {
                                console.log(err);
                              } else {
                                res.redirect(
                                  "/userDocSection/patientDashboard"
                                );
                              }
                            });
                          }
                        }
                      }
                    );
                  }
                }
              );
            }
          }
        });
      }
    }
  });
});

//Appointment cancellation route
router.post(
  "/userDocSection/cancelAppointment/:appointId",
  function (req, res) {
    Appointment.findByIdAndUpdate(req.params.appointId, {
      $set: { activityStatus: false },
    }).exec(function (err, updatedAppointment) {
      if (err) {
        console.log(err);
      } else {
        User.findByIdAndUpdate(
          req.user._id,
          { $pull: { currentDoctors: updatedAppointment.docId } },
          function (error, updatedUser) {
            if (error) {
              console.log(error);
            } else {
              Appointment.find(
                {
                  _id: ObjectId(req.params.appointId),
                  patientId: ObjectId(req.user._id),
                  docId: ObjectId(updatedAppointment.docId),
                },
                { selectedSlot: 1 }
              ).exec(function (err, selectedSlot) {
                if (err) {
                  console.log(err);
                } else {
                  const dynamicSlotKey =
                    "availableSlots." + selectedSlot[0].selectedSlot;
                  Doctor.updateOne(
                    { _id: ObjectId(updatedAppointment.docId) },
                    { $inc: { [dynamicSlotKey]: 1 } }
                  ).exec(function (err) {
                    if (err) {
                      console.log(err);
                    } else {
                      req.flash("success", "Appointment Canceled");
                      res.redirect("/userDocSection/myAppointments");
                    }
                  });
                }
              });
            }
          }
        );
      }
    });
  }
);

router.post("/generatePresc/addMedicine/:id", function (req, res) {
  const MedicineData = JSON.parse(req.body.hiddenMedicineName);
  const TestData = JSON.parse(req.body.hiddenTest);

  Doctor.find(
    { handler_id: ObjectId(req.user._id) },
    { _id: 1 },
    function (err, foundDocId) {
      if (err) {
        console.log(err);
        req.flash("error", "No Patient Found");
        res.redirect("/userDocSection/docDashboard");
      } else {
        Appointment.findOne({"patientId": req.params.id, "docId": foundDocId[0]._id, "activityStatus": true}).exec(function(error, foundAppointment){
          if(error){
            console.log(error);
          }else{
            const prescriptionData = {
              appointmentId: foundAppointment._id,
              date: Date.now(),
              disease: req.body.disease,
              medicines: MedicineData,
              test: TestData,
              comment: req.body.comment,
            };
            PatientHistory.updateOne(
              { handlerId: req.params.id, appointedDoctorId: foundDocId[0]._id },
              { $push: { prescription: prescriptionData } }
            ).exec(function (err, medrecord) {
              if (err) {
                console.log(err);
              } else {
                DoctorStats.findOneAndUpdate({"$inc": {earnings: 500, newPatients: 1, appointment: 1}}).where("handlerId").equals(req.user._id).exec(function(error, updatedStats){
                  if(error){
                    console.log(error);
                  }else{
                    PatientStats.findOneAndUpdate({"$inc": {expenditure: 550, appointment: 1}}).where("handlerId").equals(req.params.id).exec(function(err, updatedPatientStats){
                      if(err){
                        console.log(err);
                      }else{
                        console.log("Prescription Created!! Email the Prescription")
                      }
                    });
                  }
                });
              }
            });
          }
        });
      }
    }
  );
});

router.post("/userDocSection/emailPrescription/:id", function (req, res) {
  console.log(req.body, "from presc");
  sendPrescriptionMail.sendPrescriptionMail(
    req.body.email,
    req.body.filename,
    function (err, result) {
      if (err) {
        console.log(err);
      } else {
        res.redirect(
          `/userDocSection/patientList/patientInfo/${req.params.id}`
        );
        console.log("Successfully emailed prescription");
      }
    }
  );
});

//universal routes
router.get("/userDocSection/appointments/:id", function (req, res) {
  res.render("userDocSection/appointments");
});

module.exports = router;

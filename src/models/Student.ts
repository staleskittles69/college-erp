import mongoose, { Schema, model, models } from "mongoose";

export interface IPersonalDetails {
  admissionNo?: string;
  course?: string;
  gender?: string;
  dob?: string;
  nationality?: string;
  religion?: string;
  entranceType?: string;
  eamcetRank?: string;
  seatType?: string;
  categoryAndCaste?: string;
  lastStudied?: string;
  joiningDate?: string;
  phoneNo?: string;
  mobileNo?: string;
  bankAccountNo?: string;
  aadharNo?: string;
  rationCardNo?: string;
  scholarship?: string;
}

export interface IEducationDetail {
  qualification: string;
  board?: string;
  htNo?: string;
  yearOfPass?: string;
  institute?: string;
  maxMarks?: string;
  obtainedMarks?: string;
  gradeLetter?: string;
  gradePoints?: string;
}

export interface IParentDetails {
  fatherName?: string;
  fatherOccupation?: string;
  motherName?: string;
  motherOccupation?: string;
  phoneNo?: string;
  fatherMobileNo?: string;
  motherMobileNo?: string;
  annualIncome?: string;
  fatherEmail?: string;
  motherEmail?: string;
  correspondenceAddress?: string;
  permanentAddress?: string;
}

export interface IGuardianDetails {
  name?: string;
  address?: string;
  phone?: string;
  mobile?: string;
}

export interface IStudent {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  rollNo: string;
  branch: string;
  semester: number;
  section: string;
  personalDetails?: IPersonalDetails;
  educationDetails?: IEducationDetail[];
  parentDetails?: IParentDetails;
  guardianDetails?: IGuardianDetails;
  createdAt: Date;
  updatedAt: Date;
}

const PersonalDetailsSchema = new Schema<IPersonalDetails>(
  {
    admissionNo: String,
    course: String,
    gender: String,
    dob: String,
    nationality: String,
    religion: String,
    entranceType: String,
    eamcetRank: String,
    seatType: String,
    categoryAndCaste: String,
    lastStudied: String,
    joiningDate: String,
    phoneNo: String,
    mobileNo: String,
    bankAccountNo: String,
    aadharNo: String,
    rationCardNo: String,
    scholarship: String,
  },
  { _id: false }
);

const EducationDetailSchema = new Schema<IEducationDetail>(
  {
    qualification: { type: String, required: true },
    board: String,
    htNo: String,
    yearOfPass: String,
    institute: String,
    maxMarks: String,
    obtainedMarks: String,
    gradeLetter: String,
    gradePoints: String,
  },
  { _id: false }
);

const ParentDetailsSchema = new Schema<IParentDetails>(
  {
    fatherName: String,
    fatherOccupation: String,
    motherName: String,
    motherOccupation: String,
    phoneNo: String,
    fatherMobileNo: String,
    motherMobileNo: String,
    annualIncome: String,
    fatherEmail: String,
    motherEmail: String,
    correspondenceAddress: String,
    permanentAddress: String,
  },
  { _id: false }
);

const GuardianDetailsSchema = new Schema<IGuardianDetails>(
  {
    name: String,
    address: String,
    phone: String,
    mobile: String,
  },
  { _id: false }
);

const StudentSchema = new Schema<IStudent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    rollNo: { type: String, required: true },
    branch: { type: String, required: true },
    semester: { type: Number, required: true },
    section: { type: String, required: true },
    personalDetails: { type: PersonalDetailsSchema, default: undefined },
    educationDetails: { type: [EducationDetailSchema], default: undefined },
    parentDetails: { type: ParentDetailsSchema, default: undefined },
    guardianDetails: { type: GuardianDetailsSchema, default: undefined },
  },
  { timestamps: true }
);

StudentSchema.index({ userId: 1 }, { unique: true });
StudentSchema.index({ rollNo: 1, branch: 1, semester: 1 });

export default models.Student ?? model<IStudent>("Student", StudentSchema);

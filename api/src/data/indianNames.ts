/**
 * Static dictionary of common Indian first names (Latin script and Devanagari)
 * Used by the e-Bill elimination pass for deterministic, offline name classification.
 */

export const INDIAN_NAMES_LIST: string[] = [
  // Latin / English spellings
  'aakash', 'aarti', 'aarav', 'abhishek', 'advik', 'ajay', 'akash', 'alok', 'aman', 'amit',
  'anand', 'anil', 'anita', 'anjali', 'ansh', 'arav', 'arjun', 'aryan', 'aaryan', 'ashish', 'atharv', 'ayush',
  'barkha', 'bharat', 'bhavna', 'bhupesh', 'brijesh', 'chetan', 'daksh', 'deepak', 'deepika',
  'dev', 'devansh', 'dharmesh', 'dinesh', 'divya', 'ganesh', 'gaurav', 'geeta', 'gopal', 'harsh',
  'hitesh', 'jagdish', 'jignesh', 'jyoti', 'kabeer', 'kabir', 'kamal', 'kamlesh', 'karan',
  'kartik', 'kavita', 'keshav', 'kiran', 'krishna', 'kuldeep', 'kunal', 'lakshman', 'lalit',
  'madhav', 'mahesh', 'mamta', 'manish', 'manoj', 'mayank', 'meena', 'mohan', 'mohit', 'monika',
  'mukesh', 'naresh', 'naveen', 'neha', 'nidhi', 'nikhil', 'nilesh', 'nitin', 'pallavi', 'pankaj',
  'pawan', 'piyush', 'pooja', 'pradeep', 'prakash', 'prashant', 'prem', 'priya', 'raghav',
  'rahul', 'raj', 'rajesh', 'rajeev', 'rakesh', 'ram', 'ramesh', 'ravi', 'rekha', 'reyansh',
  'rishabh', 'ritu', 'rohit', 'roopa', 'sachin', 'sai', 'samar', 'sandeep', 'sanjay', 'sanjeev',
  'sapna', 'sarita', 'saurabh', 'shankar', 'shaurya', 'shivam', 'shubham', 'shweta', 'shyam',
  'siddharth', 'simran', 'sneha', 'sohan', 'sonia', 'sourabh', 'sumit', 'sunil', 'sunita',
  'suresh', 'swati', 'tanvi', 'tarun', 'tushar', 'varun', 'ved', 'vihaan', 'vikas', 'vikram',
  'vineet', 'vineeta', 'vivek', 'yash', 'yogesh', 'nimesh', 'khatri', 'sharma', 'singh', 'verma',
  'gupta', 'patel', 'shah', 'desai', 'kumar', 'pathak',

  // Devanagari spellings
  'आकाश', 'आरती', 'आरव', 'अभिषेक', 'अद्विक', 'अजय', 'आलोक', 'अमन', 'अमित', 'आनंद',
  'अनिल', 'अनीता', 'अंजलि', 'अंश', 'अर्जुन', 'आर्यन', 'आशीष', 'अथर्व', 'आयुष', 'बरखा', 'भरत',
  'भावना', 'भूपेश', 'बृजेश', 'चेतन', 'दक्ष', 'दीपक', 'दीपिका', 'देव', 'देवांश', 'धर्मेश',
  'दिनेश', 'दिव्या', 'गणेश', 'गौरव', 'गीता', 'गोपाल', 'हर्ष', 'हितेश', 'जगदीश', 'जिग्नेश',
  'ज्योति', 'कबीर', 'कमल', 'कमलेश', 'करण', 'कार्तिक', 'कविता', 'केशव', 'किरण', 'कृष्ण',
  'कुलदीप', 'कुणाल', 'लक्ष्मण', 'ललित', 'माधव', 'महेश', 'ममता', 'मनीष', 'मनोज', 'मयंक',
  'मीना', 'मोहन', 'मोहित', 'मोनिका', 'मुकेश', 'नरेश', 'नवीन', 'नेहा', 'निधि', 'निखिल',
  'नीलेश', 'नितिन', 'पल्लवी', 'पंकज', 'पवन', 'पीयूष', 'पूजा', 'प्रदीप', 'प्रकाश', 'प्रशांत',
  'प्रेम', 'प्रिया', 'राघव', 'राहुल', 'राज', 'राजेश', 'राजीव', 'राकेश', 'राम', 'रमेश',
  'रवि', 'रेखा', 'रेयांश', 'ऋषभ', 'रितु', 'रोहित', 'रूपा', 'सचिन', 'साई', 'समर',
  'संदीप', 'संजय', 'संजीव', 'सपना', 'सरिता', 'सौरभ', 'शंकर', 'शौर्य', 'शिवम', 'शुभम',
  'श्वेता', 'श्याम', 'सिद्धार्थ', 'सिमरन', 'स्नेहा', 'सोहन', 'सोनिया', 'सुमित', 'सुनील', 'सुनीता',
  'सुरेश', 'स्वाति', 'तन्वी', 'तरुण', 'तुषार', 'वरुण', 'वेद', 'विहान', 'विकास', 'विक्रम',
  'विनीत', 'विनीता', 'विवेक', 'यश', 'योगेश', 'निमेष', 'खत्री', 'शर्मा', 'सिंह', 'वर्मा',
  'गुप्ता', 'पटेल', 'शाह', 'देसाई', 'कुमार', 'पाठक'
];

// O(1) Lookup Set
export const INDIAN_NAMES_SET = new Set<string>(
  INDIAN_NAMES_LIST.map(n => n.toLowerCase().trim())
);

export function isIndianName(token: string): boolean {
  if (!token) return false;
  return INDIAN_NAMES_SET.has(token.toLowerCase().trim());
}

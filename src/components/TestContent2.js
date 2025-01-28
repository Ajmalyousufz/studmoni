import React, { useState, useEffect } from 'react';
import { db, auth, storage } from '../firebase/setup.js';
import { doc, deleteDoc, getDocs, collection, updateDoc, deleteField, setDoc, getDoc } from "firebase/firestore";
import NetworkStatus from './NetworkStatus.js';
import '../components/TestContent2.css';
import '../components/TestContent.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus, faL, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Import Toast styles
import { Tabs, TabList, Tab, TabPanel } from "react-tabs";
import 'react-tabs/style/react-tabs.css';
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

function TestContent2() {
    const [standards, setStandards] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [units, setUnits] = useState([]);
    const [contents, setContents] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedStandard, setSelectedStandard] = useState('');
    const [newStandardName, setNewStandardName] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [newSubjectName, setNewSubjectName] = useState('');
    const [selectedStudent, setSelectedStudent] = useState('');
    const [newStudentName, setNewStudentName] = useState('');
    const [selectedUnit, setSelectedUnit] = useState('');
    const [newUnitName, setNewUnitName] = useState('');
    const [selectedContent, setSelectedContent] = useState('');
    const [newContentName, setNewContentName] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [showDetails, setShowDetails] = useState(false); // State to handle transition
    const [showSubjectDetails, setShowSubjectDetails] = useState(false); // State to handle transition
    const [showUnittDetails, setShowUnitDetails] = useState(false); // State to handle transition
    const [activeTab, setActiveTab] = useState("standards"); // Track which tab is active
    const [activeContentTab, setActiveContentTab] = useState("text"); // Track which tab is active
    const [selectedImage, setSelectedImage] = useState(null);
    const zoomIn = () => setScale((prev) => Math.min(prev + 0.2, 3));
    const [scale, setScale] = useState(1);
    const [imgLoading, setImgLoading] = useState(true); // Updated variable
    const [imageFile, setImageFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isContentChange, setIsContentChange] = useState(false);

    // Zoom out function
    const zoomOut = () => setScale((prev) => Math.max(prev - 0.2, 1));

    // Reset zoom on close
    const closeImage = () => {
        setSelectedImage(null);
        setScale(1);
        setImgLoading(true);
    };


    const loaderStyle = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        color: '#fff',
        fontSize: '20px',
        fontWeight: 'bold'
    };

    const zoomButtonStyle = {
        fontSize: '20px',
        padding: '10px 15px',
        background: '#fff',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer'
    };

    const userId = auth.currentUser?.uid; // Check if user is logged in
    const standardsDB = `classes-test/${userId}/standards`;
    let subjectsDB = `classes-test/${userId}/standards/${selectedStandard}/subjects`;
    let studentsDB = `classes-test/${userId}/standards/${selectedStandard}/students`;
    let unitsDB = `classes-test/${userId}/standards/${selectedStandard}/subjects/${selectedSubject}/units`;
    let contentsDB = `classes-test/${userId}/standards/${selectedStandard}/subjects/${selectedSubject}/units/${selectedUnit}/contents`;

    useEffect(() => {
        if (userId) {
            getDbCollDocIds(standardsDB, 'standard');
        }
    }, [userId]); // Run only when userId changes

    useEffect(() => {
        if (userId) {
            getDbCollDocIds(subjectsDB, 'subject');
            getDbCollDocIds(studentsDB, 'student');
        }
    }, [showDetails]); // Run only when showDetails changes

    useEffect(() => {
        if (userId) {
            getDbCollDocIds(unitsDB, 'unit');
        }
    }, [showSubjectDetails]); // Run only when showSubjectDetails changes


    useEffect(() => {
        if (userId) {
            getDbCollDocIds(contentsDB, 'content');
        }
    }, [showUnittDetails]); // Run only when showSubjectDetails changes


    const confirmDelete = (deleteCallback, itemType = "item") => {
        const confirmation = window.confirm(`Are you sure you want to delete this ${itemType}? This action cannot be undone.`);
        if (confirmation) {
            deleteCallback();
        }
    };

    //CRUD methods

    //Create Collection's document id
    const addNewDocToColl = async (collDB, type) => {
        if (type === "standard" && !newStandardName) {
            alert("Standard name cannot be empty!");
            return;
        } else if (type === "subject" && !newSubjectName) {
            alert("Subject name cannot be empty!");
            return;
        } else if (type === "student" && !newStudentName) {
            alert("Student name cannot be empty!");
            return;
        } else if (type === "unit" && !newUnitName) {
            alert("unit name cannot be empty!");
            return;
        } else if (type === "content" && !newContentName) {
            alert("content name cannot be empty!");
            return;
        }

        setLoading(true);

        try {

            let newDocId = ``;
            let newDocRef = ``;

            if (type === "standard") {
                newDocId = `${newStandardName}`;
                newDocRef = doc(db, collDB, newDocId);
            } else if (type === "subject") {
                newDocId = `${newSubjectName}`;
                newDocRef = doc(db, collDB, newDocId);
            } else if (type === "student") {
                newDocId = `${newStudentName}`;
                newDocRef = doc(db, collDB, newDocId);
            } else if (type === "unit") {
                newDocId = `${newUnitName}`;
                newDocRef = doc(db, collDB, newDocId);
            } else if (type === "content") {
                newDocId = `${newContentName}`;
                newDocRef = doc(db, collDB, newDocId);
            }

            // Create the new document with a timestamp
            await setDoc(newDocRef, { createdAt: new Date() });

            if (type === 'standard') {

                // Reset the state and fetch updated document list
                setNewStandardName("");
                getDbCollDocIds(standardsDB, 'standard');  // This should fetch the latest documents
                setIsAdding(false);           // Close the add standard modal
                toast.success('New standard added successfully!', { position: 'top-right' });
            } else if (type === 'subject') {

                // Reset the state and fetch updated document list
                setNewSubjectName("");
                getDbCollDocIds(subjectsDB, 'subject');  // This should fetch the latest documents
                setIsAdding(false);           // Close the add standard modal
                toast.success('New Subject added successfully!', { position: 'top-right' });
            } else if (type === 'student') {

                // Reset the state and fetch updated document list
                setNewStudentName("");
                getDbCollDocIds(studentsDB, 'student');  // This should fetch the latest documents
                setIsAdding(false);           // Close the add standard modal
                toast.success('New Student added successfully!', { position: 'top-right' });
            } else if (type === 'unit') {

                // Reset the state and fetch updated document list
                setNewStudentName("");
                getDbCollDocIds(unitsDB, 'unit');  // This should fetch the latest documents
                setIsAdding(false);           // Close the add standard modal
                toast.success('New unit added successfully!', { position: 'top-right' });
            } else if (type === 'content') {

                // Reset the state and fetch updated document list
                setNewContentName("");
                getDbCollDocIds(contentsDB, 'content');  // This should fetch the latest documents
                setIsAdding(false);           // Close the add standard modal
                toast.success('New content added successfully!', { position: 'top-right' });
            }
        } catch (error) {
            console.error(error);
            if (type === 'standard') {
                toast.error('Failed to add new standard.', { position: 'top-right' });
            } else if (type === 'subject') {
                toast.error('Failed to add new subject.', { position: 'top-right' });
            } else if (type === 'student') {
                toast.error('Failed to add new student.', { position: 'top-right' });
            } else if (type === 'unit') {
                toast.error('Failed to add new unit.', { position: 'top-right' });
            } else if (type === 'content') {
                toast.error('Failed to add new content.', { position: 'top-right' });
            }
        }

        setLoading(false);
    };

    //Read Collection's Documents id
    const getDbCollDocIds = async (collDB, type) => {
        setLoading(true);
        try {
            if (type === 'standard') {

                const querySnapshot = await getDocs(collection(db, collDB));
                const documents = querySnapshot.docs.map((doc) => ({ id: doc.id }));
                setStandards(documents);
            } else if (type === 'subject') {
                console.log("selectedStandard: " + selectedStandard)
                if (selectedStandard) {

                    const querySnapshot = await getDocs(collection(db, collDB));
                    const documents = querySnapshot.docs.map((doc) => ({ id: doc.id }));
                    setSubjects(documents);
                }
            } else if (type === 'student') {
                if (selectedStandard) {

                    const querySnapshot = await getDocs(collection(db, collDB));
                    const documents = querySnapshot.docs.map((doc) => ({ id: doc.id }));
                    setStudents(documents);
                }
            } else if (type === 'unit') {
                if (selectedStandard || selectedSubject) {

                    const querySnapshot = await getDocs(collection(db, collDB));
                    const documents = querySnapshot.docs.map((doc) => ({ id: doc.id }));
                    setUnits(documents);
                }
            } else if (type === 'content') {
                if (selectedStandard || selectedSubject) {

                    const querySnapshot = await getDocs(collection(db, collDB));
                    const documents = querySnapshot.docs.map((doc) => ({
                        id: doc.id, ...doc.data() // Spreads all the fields stored in Firestore 

                    }));
                    console.log(`documents: ${JSON.stringify(documents)}`);
                    setContents(documents);
                }
            }
        } catch (error) {
            console.error(error);
        }
        setLoading(false);
    };

    // Function to update a document field
    const updateDocumentField = async (collectionName, docId, fieldName, newValue) => {
        setLoading(true);
        try {
            const docRef = doc(db, collectionName, docId);
            await updateDoc(docRef, { ['type']: 'text', [fieldName]: newValue });
            console.log(`Field "${fieldName}" updated successfully.`);
            getDbCollDocIds(contentsDB, 'content');
            toast.success(`content updated to  '${newValue}' successfully!`, { position: 'top-right' });
        } catch (error) {
            console.error("Error updating document:", error);
            toast.error('Failed to update document.', { position: 'top-right' });
        }
        setLoading(false)
    };

    // Function to create a document field
    const createDocumentField = async (collectionName, type, content) => {
        setLoading(true);
        try {
            const docId = new Date().toISOString();
            const docRef = doc(db, collectionName, docId);
            await setDoc(docRef, { ['type']: type, ['content']: content });
            console.log(`Field "${content}" updated successfully.`);
            getDbCollDocIds(collectionName, 'content');
            toast.success(`content created - \n'${content}'\n - successfully!`, { position: 'top-right' });
        } catch (error) {
            console.error("Error updating document:", error);
            toast.error('Failed to update document.', { position: 'top-right' });
        }
        setIsAdding(false)
        setLoading(false)
    };

    //Update Collection's Documents id
    const renameDocument = async (collDB, oldDocId, newDocId, type) => {
        if (!oldDocId || !newDocId || oldDocId === newDocId) return;

        if (oldDocId === newDocId) {

            if (type === 'standard') {

                toast.error('The new standard name is the same as the old one.', { position: 'top-right' });
                return;
            }
            if (type === 'subject') {
                toast.error('The new subject name is the same as the old one.', { position: 'top-right' });
                return;
            }
            if (type === 'student') {
                toast.error('The new student name is the same as the old one.', { position: 'top-right' });
                return;
            }
            if (type === 'unit') {
                toast.error('The new unit name is the same as the old one.', { position: 'top-right' });
                return;
            }
            if (type === 'content') {
                toast.error('The new content name is the same as the old one.', { position: 'top-right' });
                return;
            }
        }


        setLoading(true);
        try {

            // Step 0: Check if the new ID already exists in the standards collection
            const newDocReff = doc(db, collDB, newDocId);
            const docSnapshot = await getDoc(newDocReff);

            if (docSnapshot.exists()) {
                // If the document already exists, show an error

                setLoading(false);
                if (type === 'standard') {
                    toast.error('A standard with this name already exists. Please choose a different name.', { position: 'top-right' });
                    return;
                } else if (type === 'subject') {
                    toast.error('A subject with this name already exists. Please choose a different name.', { position: 'top-right' });
                    return;
                } else if (type === 'student') {
                    toast.error('A student with this name already exists. Please enter a different name.', { position: 'top-right' });
                    return;
                } else if (type === 'unit') {
                    toast.error('A unit with this name already exists. Please enter a different name.', { position: 'top-right' });
                    return;
                } else if (type === 'content') {
                    toast.error('A content with this name already exists. Please enter a different name.', { position: 'top-right' });
                    return;
                }
            }


            const oldDocPath = `${collDB}/${oldDocId}`;
            const newDocPath = `${collDB}/${newDocId}`;

            const oldDocRef = doc(db, oldDocPath);
            const newDocRef = doc(db, newDocPath);

            if (!type === 'content') {
                // Step 1: Copy document fields
                const oldDocSnapshot = await getDoc(oldDocRef);
                if (oldDocSnapshot.exists()) {
                    await setDoc(newDocRef, oldDocSnapshot.data()); // Create new document
                }

                // Step 2: Copy subcollections
                let subCollections = [];
                if (type === 'standard') {
                    subCollections = ["students", "subjects"];
                } else if (type === 'subject') {
                    subCollections = ["units"];
                } else if (type === 'student') {
                    subCollections = [];
                } else if (type === 'unit') {
                    subCollections = ['contents'];
                } else if (type === 'content') {
                    subCollections = [];
                }
                for (const subCollection of subCollections) {
                    const oldSubCollectionRef = collection(db, oldDocPath, subCollection);
                    const newSubCollectionRef = collection(db, newDocPath, subCollection);

                    const subDocs = await getDocs(oldSubCollectionRef);
                    for (const subDoc of subDocs.docs) {
                        await setDoc(doc(newSubCollectionRef, subDoc.id), subDoc.data()); // Copy sub-document
                    }
                }

            } else {

            }

            // Step 3: Delete the old document
            deleteDocumentAndSubcollections(collDB, oldDocId, type);

            if (type === 'standard') {
                toast.success(`Document renamed to 'Standard:${newDocId}' successfully!`, { position: 'top-right' });
            } else if (type === 'subject') {
                toast.success(`Subject renamed to  '${newDocId}' successfully!`, { position: 'top-right' });
            } else if (type === 'student') {
                toast.success(`student renamed to  '${newDocId}' successfully!`, { position: 'top-right' });
            } else if (type === 'unit') {
                toast.success(`unit renamed to  '${newDocId}' successfully!`, { position: 'top-right' });
            } else if (type === 'content') {
                toast.success(`content renamed to  '${newDocId}' successfully!`, { position: 'top-right' });
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to rename document.', { position: 'top-right' });
        }
    };

    //Delete Collection's Documents id
    const deleteDocumentAndSubcollections = async (collDB, selstd, type) => {
        console.log(`delete fun call`);
        console.log(`selectedStandard : ${selectedStandard} : selstd :${selstd}`);
        if (type === 'standard') {
            setSelectedStandard(selstd);
        } else if (type === 'subject') {
            setSelectedSubject(selstd);
        } else if (type === 'student') {
            setSelectedStudent(selstd);
        } else if (type === 'unit') {
            setSelectedUnit(selstd);
        } else if (type === 'content') {
            setSelectedContent(selstd);
        }
        console.log(`selectedStandard : ${selectedStandard} : selstd :${selstd}`);
        console.log(`selectedSubject : ${selectedSubject} : selstd :${selstd}`);
        console.log(`selectedStudent : ${selectedStudent} : selstd :${selstd}`);
        console.log(`selectedUnit : ${selectedUnit} : selstd :${selstd}`);
        console.log(`selectedContent id : ${selectedContent} : selstd :${selstd}`);
        if (!selstd) return;
        setLoading(true);

        try {
            const docPath = `${collDB}/${selstd}`;
            const docRef = doc(db, docPath);

            // Step 1: Delete all fields in the document
            const documentSnapshot = await getDocs(collection(db, collDB));
            if (!documentSnapshot.empty) {
                let fieldUpdates = {};
                documentSnapshot.forEach(document => {
                    if (document.id === selstd) {
                        Object.keys(document.data()).forEach(field => {
                            fieldUpdates[field] = deleteField(); // Mark fields for deletion
                        });
                    }
                });

                if (Object.keys(fieldUpdates).length > 0) {
                    await updateDoc(docRef, fieldUpdates); // Remove all fields
                }
            }

            // Step 2: Define subcollections to delete ('students' and 'subjects')
            let subCollections = [];
            if (type === 'standard') {

                subCollections = ["students", "subjects"];
            } else if (type === 'subject') {
                subCollections = ["units"];
            } else if (type === 'student') {
                subCollections = [];
            } else if (type === 'unit') {
                subCollections = ['contents'];
            } else if (type === 'content') {
                subCollections = [];
            }

            // Step 3: Loop through each subcollection and delete all documents inside them
            for (const subCollection of subCollections) {
                const subCollectionRef = collection(db, docPath, subCollection);
                const subDocs = await getDocs(subCollectionRef);

                for (const subDoc of subDocs.docs) {
                    await deleteDoc(doc(subCollectionRef, subDoc.id)); // Delete each sub-document
                }
            }

            // Step 4: Delete the empty document itself
            await deleteDoc(docRef);

            if (type === 'standard') {
                getDbCollDocIds(standardsDB, 'standard');
                toast.success(`Standard:${selstd} deleted successfully!`, { position: 'top-right' });

            } else if (type === 'subject') {
                getDbCollDocIds(subjectsDB, 'subject');
                toast.success(`Subject:${selstd} deleted successfully!`, { position: 'top-right' });

            } else if (type === 'student') {
                getDbCollDocIds(studentsDB, 'student');
                toast.success(`Student:${selstd} deleted successfully!`, { position: 'top-right' });
            } else if (type === 'unit') {
                getDbCollDocIds(unitsDB, 'unit');
                toast.success(`unit:${selstd} deleted successfully!`, { position: 'top-right' });
            } else if (type === 'content') {
                getDbCollDocIds(contentsDB, 'content');
                toast.success(`content with id:${selstd} deleted successfully!`, { position: 'top-right' });
            }

        } catch (error) {
            console.error(error);
            toast.error('Failed to delete data', { position: 'top-right' });
        }

        setLoading(false);
    };

    // Function to handle image selection
    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setImageFile(file);
        }
    };

    // Function to upload image and save URL to Firestore
    const uploadImageToFirebase = async (uploadType) => {
        if (!imageFile) return alert("Please choose an image first!");
        setUploading(true);

        const storageRef = ref(storage, `images/${imageFile.name}`);
        const uploadTask = uploadBytesResumable(storageRef, imageFile);

        uploadTask.on(
            "state_changed",
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setUploadProgress(progress);
            },
            (error) => {
                console.error("Upload failed:", error);
                toast.error(`Image updation failed!`, { position: 'top-right' });
                setUploading(false);
            },
            async () => {
                if (uploadType === 'create') {

                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    await createDocumentField(contentsDB, "image", downloadURL);
                    setUploading(false);
                    setImageFile(null);
                    setUploadProgress(0);
                    getDbCollDocIds(contentsDB, "content");
                    toast.success(`Image updated to successfully!`, { position: 'top-right' });
                } else if (uploadType === 'update') {
                    console.log('image content id : ' + selectedContent);

                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    try {
                        const docRef = doc(db, contentsDB, selectedContent);
                        await updateDoc(docRef, {type : 'image', content: downloadURL });
                        getDbCollDocIds(contentsDB, "content");
                        toast.success(`Image updated to successfully!`, { position: 'top-right' });
                        setIsEditing(false);
                    } catch (error) {
                        toast.error(`Image updation failed!`, { position: 'top-right' });

                    }
                    setUploading(false);
                    setUploadProgress(0);

                }
            }
        );
    };



    return (
        <div>
            <NetworkStatus />
            <ToastContainer />
            {/* Overlay with loader */}
            {loading && (
                <div className="loader-overlay">
                    <div className="loader"></div>
                </div>
            )}

            {/* Header */}
            <header className="App-header">
                <h1>Madrassa Students Monitoring App</h1>
            </header>

            {/* Main Content with Transition */}
            <div className={`main-content`}>
                {
                    !showDetails ?
                        (
                            //Standards List
                            <div className={`standards-grid  ${showDetails ? 'slide-out' : 'slide-in'}`}>
                                {standards.map((standard, index) => (
                                    <div
                                        className='standard-card'
                                        key={standard.id}
                                        onClick={() => {
                                            setSelectedStandard(standard.id);
                                            setShowDetails(true);// show Details view
                                        }}
                                    >
                                        <span>Standard: {standard.id}</span>

                                        <div className='action-container'>
                                            <FontAwesomeIcon
                                                icon={faEdit}
                                                className='edit-icon'
                                                onClick={() => {
                                                    setSelectedStandard(standard.id);
                                                    setIsEditing(true);
                                                    setNewStandardName(standard.id); // Prefill with current name
                                                }}
                                            />

                                            {/* Modal Popup for Edit */}
                                            {isEditing && selectedStandard === standard.id && (
                                                <div className="modal">
                                                    <div className="modal-content">
                                                        <h3>Edit Standard</h3>
                                                        <input
                                                            type="text"
                                                            value={newStandardName}
                                                            onChange={(e) => setNewStandardName(e.target.value)}
                                                            placeholder="Enter new standard name"
                                                        />
                                                        <div className="modal-buttons">
                                                            <button onClick={() => {
                                                                const confirmRename = window.confirm(`Are you sure you want to rename "${selectedStandard}" to "${newStandardName}"?`);
                                                                if (confirmRename) {
                                                                    renameDocument(standardsDB, selectedStandard, newStandardName, 'standard');
                                                                    setIsEditing(false);
                                                                }
                                                            }}>Save</button>
                                                            <button onClick={() => setIsEditing(false)}>Cancel</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            <FontAwesomeIcon
                                                icon={faTrash}
                                                className='delete-icon'
                                                onClick={() => {
                                                    setSelectedStandard(standard.id);
                                                    confirmDelete(() => deleteDocumentAndSubcollections(standardsDB, standard.id, 'standard'), "standard");
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                        :
                        ( //studetns and subjects units contents
                            <div>
                                {!showSubjectDetails ?
                                    ( //students and subjects tabs
                                        <div>
                                            <div>
                                                <button className="back-button"  >
                                                    <FontAwesomeIcon icon={faArrowLeft} onClick={() => setShowDetails(false)} style={{ margin: '10px' }} />
                                                </button>

                                            </div>
                                            <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

                                                <span style={{ alignItems: 'center', justifyContent: 'center', margin: '5px', background: 'yellow', padding: '5px', borderRadius: '5px' }}>Standard {selectedStandard}</span>
                                            </div>
                                            <div style={{ background: 'skyblue', padding: '10px', margin: '-5px' }}>

                                                <Tabs onSelect={(index) => setActiveTab(index === 0 ? "students" : "subjects")}>
                                                    <TabList>
                                                        <Tab>Students</Tab>
                                                        <Tab>Subjects</Tab>
                                                    </TabList>


                                                    <TabPanel>
                                                        <div >
                                                            {students.map((student, index) => (
                                                                <div
                                                                    className='standard-card'
                                                                    key={student.id}
                                                                    onClick={() => {
                                                                        setSelectedStudent(student.id);
                                                                        setShowDetails(true);// show Details view
                                                                    }}
                                                                >
                                                                    <span>{student.id}</span>

                                                                    <div className='action-container'>
                                                                        <FontAwesomeIcon
                                                                            icon={faEdit}
                                                                            className='edit-icon'
                                                                            onClick={() => {
                                                                                setSelectedStudent(student.id);
                                                                                setIsEditing(true);
                                                                                setNewStudentName(student.id); // Prefill with current name
                                                                            }}
                                                                        />

                                                                        {/* Modal Popup for Edit */}
                                                                        {isEditing && selectedStudent === student.id && (
                                                                            <div className="modal">
                                                                                <div className="modal-content">
                                                                                    <h3>Edit Standard</h3>
                                                                                    <input
                                                                                        type="text"
                                                                                        value={newStudentName}
                                                                                        onChange={(e) => setNewStudentName(e.target.value)}
                                                                                        placeholder="Enter new standard name"
                                                                                    />
                                                                                    <div className="modal-buttons">
                                                                                        <button onClick={() => {
                                                                                            const confirmRename = window.confirm(`Are you sure you want to rename "${selectedStudent}" to "${newStudentName}"?`);
                                                                                            if (confirmRename) {
                                                                                                renameDocument(studentsDB, selectedStudent, newStudentName, 'student');
                                                                                                setIsEditing(false);
                                                                                            }
                                                                                        }}>Save</button>
                                                                                        <button onClick={() => setIsEditing(false)}>Cancel</button>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        )}



                                                                        <FontAwesomeIcon
                                                                            icon={faTrash}
                                                                            className='delete-icon'
                                                                            onClick={() => {
                                                                                setSelectedStudent(student.id);
                                                                                confirmDelete(() => deleteDocumentAndSubcollections(studentsDB, student.id, 'student'), "student");
                                                                            }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </TabPanel>
                                                    <TabPanel>
                                                        <div >
                                                            {subjects.map((subject, index) => (
                                                                <div
                                                                    className='standard-card'
                                                                    key={subject.id}
                                                                    onClick={() => {
                                                                        setSelectedSubject(subject.id);
                                                                        setShowSubjectDetails(true);// show Subject Details view
                                                                    }}
                                                                >
                                                                    <span>{subject.id}</span>

                                                                    <div className='action-container'>
                                                                        <FontAwesomeIcon
                                                                            icon={faEdit}
                                                                            className='edit-icon'
                                                                            onClick={() => {
                                                                                setSelectedSubject(subject.id);
                                                                                setIsEditing(true);
                                                                                setNewSubjectName(subject.id); // Prefill with current name
                                                                            }}
                                                                        />

                                                                        {/* Modal Popup for Edit */}
                                                                        {isEditing && selectedSubject === subject.id && (
                                                                            <div className="modal">
                                                                                <div className="modal-content">
                                                                                    <h3>Edit Standard</h3>
                                                                                    <input
                                                                                        type="text"
                                                                                        value={newSubjectName}
                                                                                        onChange={(e) => setNewSubjectName(e.target.value)}
                                                                                        placeholder="Enter new standard name"
                                                                                    />
                                                                                    <div className="modal-buttons">
                                                                                        <button onClick={() => {
                                                                                            const confirmRename = window.confirm(`Are you sure you want to rename "${selectedSubject}" to "${newSubjectName}"?`);
                                                                                            if (confirmRename) {
                                                                                                renameDocument(subjectsDB, selectedSubject, newSubjectName, 'subject');
                                                                                                setIsEditing(false);
                                                                                            }
                                                                                        }}>Save</button>
                                                                                        <button onClick={() => setIsEditing(false)}>Cancel</button>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                        <FontAwesomeIcon
                                                                            icon={faTrash}
                                                                            className='delete-icon'
                                                                            onClick={() => {
                                                                                setSelectedSubject(subject.id);
                                                                                confirmDelete(() => deleteDocumentAndSubcollections(subjectsDB, subject.id, 'subject'), "subject");
                                                                            }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </TabPanel>
                                                </Tabs>
                                            </div>
                                        </div>
                                    )
                                    :
                                    (!showUnittDetails ?
                                        ( //units
                                            <div>
                                                <div>
                                                    <button className="back-button"  >
                                                        <FontAwesomeIcon icon={faArrowLeft} onClick={() => setShowSubjectDetails(false)} style={{ margin: '10px' }} />
                                                    </button>

                                                </div>

                                                <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

                                                    <span style={{ alignItems: 'center', justifyContent: 'center', margin: '5px', background: 'yellow', color: 'black', padding: '5px', borderRadius: '5px' }}>Standard {selectedStandard}</span>
                                                    <span style={{ alignItems: 'center', justifyContent: 'center', margin: '5px', background: 'black', color: 'yellow', padding: '5px', borderRadius: '5px' }}>Subject {selectedSubject}</span>
                                                </div>

                                                <div style={{ background: 'skyblue', padding: '10px', margin: '-5px' }}>
                                                    <div >
                                                        {units.map((unit, index) => (
                                                            <div
                                                                className='standard-card'
                                                                key={unit.id}
                                                                onClick={() => {
                                                                    setSelectedUnit(unit.id);
                                                                    setShowUnitDetails(true);// show Details view
                                                                }}
                                                            >
                                                                <span>{unit.id}</span>

                                                                <div className='action-container'>
                                                                    <FontAwesomeIcon
                                                                        icon={faEdit}
                                                                        className='edit-icon'
                                                                        onClick={() => {
                                                                            setSelectedUnit(unit.id);
                                                                            setIsEditing(true);
                                                                            setNewUnitName(unit.id); // Prefill with current name
                                                                        }}
                                                                    />

                                                                    {/* Modal Popup for Edit */}
                                                                    {isEditing && selectedUnit === unit.id && (
                                                                        <div className="modal">
                                                                            <div className="modal-content">
                                                                                <h3>Edit Unit</h3>
                                                                                <input
                                                                                    type="text"
                                                                                    value={newUnitName}
                                                                                    onChange={(e) => setNewUnitName(e.target.value)}
                                                                                    placeholder="Enter new unit name"
                                                                                />
                                                                                <div className="modal-buttons">
                                                                                    <button onClick={() => {
                                                                                        const confirmRename = window.confirm(`Are you sure you want to rename "${selectedUnit}" to "${newUnitName}"?`);
                                                                                        if (confirmRename) {
                                                                                            renameDocument(unitsDB, selectedUnit, newUnitName, 'unit');
                                                                                            setIsEditing(false);
                                                                                        }
                                                                                    }}>Save</button>
                                                                                    <button onClick={() => setIsEditing(false)}>Cancel</button>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}



                                                                    <FontAwesomeIcon
                                                                        icon={faTrash}
                                                                        className='delete-icon'
                                                                        onClick={() => {
                                                                            setSelectedStudent(unit.id);
                                                                            confirmDelete(() => deleteDocumentAndSubcollections(unitsDB, unit.id, 'unit'), "unit");
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                        :
                                        (//contents
                                            <div>

                                                <div>
                                                    <button className="back-button"  >
                                                        <FontAwesomeIcon icon={faArrowLeft} onClick={() => setShowUnitDetails(false)} style={{ margin: '10px' }} />
                                                    </button>

                                                </div>

                                                <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

                                                    <span style={{ alignItems: 'center', justifyContent: 'center', margin: '5px', background: 'yellow', color: 'black', padding: '5px', borderRadius: '5px' }}>Standard {selectedStandard}</span>
                                                    <span style={{ alignItems: 'center', justifyContent: 'center', margin: '5px', background: 'black', color: 'yellow', padding: '5px', borderRadius: '5px' }}>Subject {selectedSubject}</span>
                                                    <span style={{ alignItems: 'center', justifyContent: 'center', margin: '5px', background: 'blue', color: 'white', padding: '5px', borderRadius: '5px' }}>Unit {selectedUnit}</span>
                                                </div>

                                                <div style={{ background: 'skyblue', padding: '10px', margin: '-5px' }}>
                                                    <div >
                                                        {contents.map(
                                                            (content, index) => (
                                                                <div
                                                                    className='standard-card'
                                                                    key={content.id}
                                                                    onClick={() => {
                                                                        setSelectedContent(content.id);
                                                                        setShowUnitDetails(true);// show Details view
                                                                    }}
                                                                >

                                                                    <span>
                                                                        {content.type === "text" ? (
                                                                            <div>
                                                                                <h2 style={{ fontSize: "25px", textAlign: "justify" }}>{content.content}</h2>
                                                                            </div>
                                                                        ) : (
                                                                            <div style={{ width: "100%", position: "relative" }}>
                                                                                {/* Show loader while image loads */}
                                                                                {imgLoading && (
                                                                                    <div style={loaderStyle}>
                                                                                        <div className="spinner"></div>
                                                                                    </div>
                                                                                )}

                                                                                <img
                                                                                    src={content.content}
                                                                                    alt="Loaded content"
                                                                                    style={{ width: "100%", height: "auto", display: "block", cursor: "pointer" }}
                                                                                    onLoad={() => setImgLoading(false)}
                                                                                    onClick={() => setSelectedImage(content.content)}
                                                                                />
                                                                            </div>
                                                                        )}

                                                                        {/* Fullscreen Image Modal */}
                                                                        {selectedImage && (
                                                                            <div
                                                                                style={{
                                                                                    position: "fixed",
                                                                                    top: 0,
                                                                                    left: 0,
                                                                                    width: "100vw",
                                                                                    height: "100vh",
                                                                                    backgroundColor: "rgba(0,0,0,0.9)",
                                                                                    display: "flex",
                                                                                    alignItems: "center",
                                                                                    justifyContent: "center",
                                                                                    flexDirection: "column",
                                                                                    zIndex: 1000,
                                                                                }}
                                                                                onClick={closeImage}
                                                                            >
                                                                                {/* Show Loader in Fullscreen */}
                                                                                {imgLoading && (
                                                                                    <div style={loaderStyle}>
                                                                                        <div className="spinner"></div>
                                                                                    </div>
                                                                                )}

                                                                                {/* Image with Zoom Effect */}
                                                                                <div
                                                                                    style={{
                                                                                        transform: `scale(${scale})`,
                                                                                        transition: "transform 0.3s ease",
                                                                                        maxWidth: "100vw",
                                                                                        maxHeight: "100vh",
                                                                                        overflow: "hidden",
                                                                                    }}
                                                                                >
                                                                                    <img
                                                                                        src={selectedImage}
                                                                                        alt="Full size"
                                                                                        style={{ width: "100vw", height: "auto", cursor: "zoom-in", display: imgLoading ? "none" : "block" }}
                                                                                        onLoad={() => setImgLoading(false)}
                                                                                        onClick={(e) => e.stopPropagation()} // Prevent closing on click
                                                                                    />
                                                                                </div>

                                                                                {/* Zoom Controls */}
                                                                                <div style={{ position: "absolute", bottom: 20, display: "flex", gap: "10px" }}>
                                                                                    <button
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            zoomOut();
                                                                                        }}
                                                                                        style={zoomButtonStyle}
                                                                                    >
                                                                                        -
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            zoomIn();
                                                                                        }}
                                                                                        style={zoomButtonStyle}
                                                                                    >
                                                                                        +
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </span>


                                                                    <div className='action-container'>
                                                                        <FontAwesomeIcon
                                                                            icon={faEdit}
                                                                            className='edit-icon'
                                                                            onClick={() => {
                                                                                setSelectedContent(content.id);
                                                                                setIsEditing(true);
                                                                                setNewContentName(content.content); // Prefill with current name
                                                                            }}
                                                                        />

                                                                        {/* Modal Popup for Edit */}
                                                                        {isEditing && selectedContent === content.id && (

                                                                            <div>
                                                                                {
                                                                                    content.type === 'text' ?
                                                                                        (
                                                                                            <div className="modal">
                                                                                                <div className="modal-content">
                                                                                                    <h3>Edit Text Content</h3>
                                                                                                    <input
                                                                                                        type="text"
                                                                                                        value={newContentName}
                                                                                                        onChange={(e) => setNewContentName(e.target.value)}
                                                                                                        placeholder="Enter new Content name"
                                                                                                    />
                                                                                                    <div className="modal-buttons">
                                                                                                        <button
                                                                                                            onClick={() => {
                                                                                                                const confirmRename = window.confirm(`Are you sure you want to update "${content.content}" to "${newContentName}"?`);
                                                                                                                if (confirmRename) {
                                                                                                                    //renameDocument(contentsDB, selectedContent, newContentName, 'content');
                                                                                                                    updateDocumentField(contentsDB, content.id, "content", newContentName);
                                                                                                                    setIsEditing(false);
                                                                                                                }
                                                                                                            }}>Save
                                                                                                        </button>
                                                                                                        <button
                                                                                                            onClick={() => setIsEditing(false)}>Cancel
                                                                                                        </button>
                                                                                                    </div>

                                                                                                    <button style={{ background: 'grey', borderRadius: '20px', color: 'wheat', paddingLeft: '10px', paddingRight: '10px', fontSize: '10px' }}>
                                                                                                        {content.type === 'text' ?
                                                                                                            (// Only this calls
                                                                                                                <div>
                                                                                                                    <button onClick={() => { setIsContentChange(true) }}>
                                                                                                                        Change to Image Content?
                                                                                                                    </button>

                                                                                                                    {isEditing && isContentChange &&
                                                                                                                        (
                                                                                                                            <div className="modal">
                                                                                                                                <div className="modal-content">
                                                                                                                                    <h3 style={{ color: 'black' }}>Update to Image Content</h3>
                                                                                                                                    <input style={{ color: 'grey' }} type="file" accept="image/*" onChange={handleImageChange} />
                                                                                                                                    <div className="modal-buttons">
                                                                                                                                        <button style={{ color: 'black' }} onClick={() => uploadImageToFirebase('update')}>
                                                                                                                                            {uploading ? `Uploading ${uploadProgress.toFixed(0)}%...` : "Upload Image"}
                                                                                                                                        </button>
                                                                                                                                        <button style={{ color: 'black' }} onClick={() => setIsContentChange(false)}>Cancel</button>
                                                                                                                                    </div>

                                                                                                                                </div>
                                                                                                                            </div>
                                                                                                                        )
                                                                                                                    }
                                                                                                                </div>
                                                                                                            )
                                                                                                            :
                                                                                                            ( // This is no call

                                                                                                                <div></div>

                                                                                                            )
                                                                                                        }</button>
                                                                                                </div>
                                                                                            </div>
                                                                                        )
                                                                                        :
                                                                                        (

                                                                                            <div className="modal">
                                                                                                <div className="modal-content">
                                                                                                    <h3>Edit Content</h3>
                                                                                                    <input type="file" accept="image/*" onChange={handleImageChange} />
                                                                                                    <div className="modal-buttons">
                                                                                                        <button onClick={() => uploadImageToFirebase('update')}>
                                                                                                            {uploading ? `Uploading ${uploadProgress.toFixed(0)}%...` : "Upload Image"}
                                                                                                        </button>
                                                                                                        <button onClick={() => setIsEditing(false)}>Cancel</button>
                                                                                                    </div>
                                                                                                    <button style={{ background: 'grey', borderRadius: '20px', color: 'wheat', paddingLeft: '10px', paddingRight: '10px', fontSize: '10px' }}>
                                                                                                        {content.type === 'text' ?
                                                                                                            ( //This is not calling anymore
                                                                                                                <div>
                                                                                                                    <button>
                                                                                                                        Change to Image Content
                                                                                                                    </button>
                                                                                                                </div>
                                                                                                            )
                                                                                                            :
                                                                                                            ( // Only this calls

                                                                                                                <div>
                                                                                                                    <button onClick={() => { setIsContentChange(true) }}>
                                                                                                                        Change to Text Content?
                                                                                                                    </button>

                                                                                                                    {isEditing && isContentChange &&
                                                                                                                        (
                                                                                                                            <div className="modal">
                                                                                                                                <div className="modal-content">
                                                                                                                                    <h3 style={{ color: 'black' }}>Edit Content</h3>
                                                                                                                                    <input style={{ color: 'black' }}
                                                                                                                                        type="text"
                                                                                                                                        onChange={(e) => setNewContentName(e.target.value)}
                                                                                                                                        placeholder="Enter new text Content"
                                                                                                                                    />
                                                                                                                                    <div className="modal-buttons">
                                                                                                                                        <button style={{ color: 'black' }}
                                                                                                                                            onClick={() => {
                                                                                                                                                const confirmRename = window.confirm(`Are you sure you want to update "${content.content}" to "${newContentName}"?`);
                                                                                                                                                if (confirmRename) {
                                                                                                                                                    //renameDocument(contentsDB, selectedContent, newContentName, 'content');
                                                                                                                                                    updateDocumentField(contentsDB, content.id, "content", newContentName);
                                                                                                                                                    setIsContentChange(false);
                                                                                                                                                    setIsEditing(false)
                                                                                                                                                }
                                                                                                                                            }}>Save
                                                                                                                                        </button>
                                                                                                                                        <button style={{ color: 'black' }}
                                                                                                                                            onClick={() => setIsContentChange(false)}>Cancel
                                                                                                                                        </button>
                                                                                                                                    </div>

                                                                                                                                </div>
                                                                                                                            </div>
                                                                                                                        )
                                                                                                                    }
                                                                                                                </div>

                                                                                                            )
                                                                                                        }</button>
                                                                                                </div>
                                                                                            </div>

                                                                                        )
                                                                                }
                                                                            </div>
                                                                        )}

                                                                        <FontAwesomeIcon
                                                                            icon={faTrash}
                                                                            className='delete-icon'
                                                                            onClick={() => {
                                                                                setSelectedContent(content.id);
                                                                                confirmDelete(() => deleteDocumentAndSubcollections(contentsDB, content.id, 'content'), "content");
                                                                            }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    )
                                }
                            </div>
                        )
                }
            </div>

            {/* Floating Button to Add New Standard */}
            <button
                className="fab-button"
                onClick={() => setIsAdding(true)}
            >
                <FontAwesomeIcon icon={faPlus} />
            </button>

            {/* Modal for Adding New Standard */}
            {isAdding && (
                <div className="modal">
                    <div className="modal-content">
                        {showDetails ?
                            (!showSubjectDetails ?
                                (// subject student adding
                                    activeTab === "subjects" ?

                                        (
                                            <div>
                                                Add New Subject

                                                <input
                                                    type="text"
                                                    value={newSubjectName}
                                                    onChange={(e) => setNewSubjectName(e.target.value)}
                                                    placeholder="Enter new Subject name"
                                                />
                                                <div className="modal-buttons">
                                                    <button onClick={() => addNewDocToColl(subjectsDB, "subject")}>Save</button>

                                                    <button onClick={() => setIsAdding(false)}>Cancel</button>
                                                </div>
                                            </div>
                                        )
                                        :

                                        (
                                            <div>
                                                Add New Student
                                                <input
                                                    type="text"
                                                    value={newStudentName}
                                                    onChange={(e) => setNewStudentName(e.target.value)}
                                                    placeholder="Enter new Student name"
                                                />
                                                <div className="modal-buttons">
                                                    <button onClick={() => addNewDocToColl(studentsDB, "student")}>Save</button>

                                                    <button onClick={() => setIsAdding(false)}>Cancel</button>
                                                </div>
                                            </div>
                                        )
                                )
                                :
                                (
                                    !showUnittDetails ?
                                        (//unit add
                                            <div>
                                                <h3>Add New Unit</h3>

                                                <input
                                                    type="text"
                                                    value={newUnitName}
                                                    onChange={(e) => setNewUnitName(e.target.value)}
                                                    placeholder="Enter new Unit name"
                                                />
                                                <div className="modal-buttons">
                                                    <button onClick={() => addNewDocToColl(unitsDB, "unit")}>Save</button>

                                                    <button onClick={() => setIsAdding(false)}>Cancel</button>
                                                </div>
                                            </div>
                                        )
                                        :
                                        (// add content

                                            <div>
                                                <h3>Add New Content</h3>



                                                <Tabs onSelect={(index) => setActiveContentTab(index === 0 ? "text" : "image")}>
                                                    <TabList>
                                                        <Tab>Add Text</Tab>
                                                        <Tab>Add Image</Tab>
                                                    </TabList>

                                                    <TabPanel>
                                                        <input
                                                            type="text"
                                                            onChange={(e) => setNewContentName(e.target.value)}
                                                            placeholder="Enter new Content"
                                                        />
                                                        <div className="modal-buttons">
                                                            <button onClick={() => createDocumentField(contentsDB, "text", newContentName)}>Save</button>

                                                            <button onClick={() => setIsAdding(false)}>Cancel</button>
                                                        </div>
                                                    </TabPanel>

                                                    {/* Image Upload */}
                                                    <TabPanel>
                                                        <input type="file" accept="image/*" onChange={handleImageChange} />
                                                        <div className="modal-buttons">
                                                            <button onClick={() => uploadImageToFirebase('create')} disabled={uploading}>
                                                                {uploading ? `Uploading ${uploadProgress.toFixed(0)}%...` : "Upload Image"}
                                                            </button>
                                                        </div>
                                                    </TabPanel>
                                                </Tabs>
                                            </div>
                                        )

                                )
                            )
                            :
                            (//standard add
                                <div>
                                    <h3>Add New Standard</h3>

                                    <input
                                        type="text"
                                        value={newStandardName}
                                        onChange={(e) => setNewStandardName(e.target.value)}
                                        placeholder="Enter new standard name"
                                    />
                                    <div className="modal-buttons">
                                        <button onClick={() => addNewDocToColl(standardsDB, "standard")}>Save</button>

                                        <button onClick={() => setIsAdding(false)}>Cancel</button>
                                    </div>
                                </div>

                            )
                        }

                    </div>
                </div>
            )}
        </div>
    );
}

export default TestContent2;

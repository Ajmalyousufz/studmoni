import React, { useState, useEffect } from 'react';
import { auth, db, storage } from '../firebase/setup.js';
import { doc, setDoc, collection, getDocs, addDoc, getDoc, updateDoc, arrayUnion, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import ImagePicker from '../components/ImagePicker.js';
import '../components/TestContent.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';

function TestContent() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);

    const [standards, setStandards] = useState([]);
    const [students, setStudents] = useState({});
    const [subjects, setSubjects] = useState([]);
    const [units, setUnits] = useState([]);
    const [showStudentModal, setShowStudentModal] = useState(false);
    const [showSubjectModal, setShowSubjectModal] = useState(false);
    const [selectedStandard, setSelectedStandard] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const [newStandard, setNewStandard] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState("");
    const [tempInput, setTempInput] = useState("");
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [studyContents, setStudyContents] = useState({});
    const [unitName, setUnitName] = useState("");  // For unit name input
    const [newContentType, setNewContentType] = useState(null);
    const [image, setImage] = useState(null);
    const [isLoading, setIsLoading] = useState(true); // Loading state



    const uid = auth.currentUser.uid;
    const userId = auth.currentUser.uid;
    //console.log("user id: " + uid);

    useEffect(() => {
        fetchStandards();
    }, []);

    useEffect(() => {
        if (!selectedStandard) return; // Exit if no standard is selected

        const fetchStandardData = async () => {
            try {
                if (!auth.currentUser) {
                    console.error("User is not authenticated.");
                    return;
                }

                // Define paths for subjects and students collections
                const subjectsCollectionPath = `classes-test/${userId}/standards/${selectedStandard}/subjects`;
                const studentsCollectionPath = `classes-test/${userId}/standards/${selectedStandard}/students`;

                // Fetch subjects and students
                const [subjectsSnapshot, studentsSnapshot] = await Promise.all([
                    getDocs(collection(db, subjectsCollectionPath)),
                    getDocs(collection(db, studentsCollectionPath)),
                ]);

                // Extract subjects and students from snapshots
                const subjects = subjectsSnapshot.docs.map((doc) => doc.id); // Get subject IDs
                const students = studentsSnapshot.docs.map((doc) => doc.id); // Get student IDs

                // Update the state with fetched data
                setSubjects((prev) => ({
                    ...prev,
                    [selectedStandard]: subjects,
                }));

                setStudents((prev) => ({
                    ...prev,
                    [selectedStandard]: students,
                }));

                console.log("Subjects for selectedStandard:", subjects);
                console.log("Students for selectedStandard:", students);
            } catch (error) {
                console.error("Error fetching standard data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStandardData();

    }, [selectedStandard, userId]);


    const fetchStandards = async () => {
        try {
            const standardDocs = await getDocs(collection(db, `classes-test/${uid}/standards`));
            const standardsList = standardDocs.docs.map(doc => doc.id);
            setStandards(standardsList);
        } catch (error) {
            console.error('Error fetching standards:', error);
        }
    };

    const fetchSubjects = async (standardId) => {
        try {
            const subjectDocs = await getDocs(collection(db, `classes-test/${uid}/standards/${standardId}/subjects`), { source: "server" });

            const subjectsList = subjectDocs.docs.map(doc => doc.id);
            setSubjects(subjectsList);
            console.log('Subject', subjectsList);
            subjectDocs.docs.forEach(doc => {
                console.log('Document ID:', doc.id);
                console.log('Document Data:', doc.data());
            });

        } catch (error) {
            console.error('Error fetching subjects:', error);
        }
    };

    const fetchUnits = async (standardId, subjectName) => {
        try {
            const unitDocs = await getDocs(collection(db, `classes-test/${uid}/standards/${standardId}/subjects/${subjectName}/units`));
            const unitsList = unitDocs.docs.map(doc => doc.id);
            setUnits(unitsList);
        } catch (error) {
            console.error('Error fetching units:', error);
        }
    };

    const handleImageSelect = (file) => {
        setSelectedFile(file);
        const reader = new FileReader();
        reader.onload = () => {
            setFilePreview(reader.result); // Show a preview of the selected file
        };
        reader.readAsDataURL(file);
    };

    const handleStandardFocus = () => {
        fetchStandards();
    };

    const handleSubjectFocus = () => {
        const standard = document.getElementById("standard_input").value.trim();
        if (standard) {
            fetchSubjects(standard);
        } else {
            alert("Please select a standard first.");
            document.getElementById("subject_input").blur();
        }
    };

    const handleUnitFocus = () => {
        const standard = document.getElementById("standard_input").value.trim();
        const subject = document.getElementById("subject_input").value.trim();
        if (standard && subject) {
            fetchUnits(standard, subject);
        } else {
            alert("Please select both standard and subject first.");

            document.getElementById("unit_input").blur();
        }
    };

    const onClassSubmitClick = async () => {
        const standard = document.getElementById("standard_input").value.trim();
        if (standard) {
            try {
                await setDoc(doc(db, `classes-test/${uid}/standards/${standard}`), { createdAt: new Date() });

                alert("Standard " + standard + " is Successfully Added");
                fetchStandards();
            } catch (error) {
                console.error('Error adding standard:', error);
                alert("Error Occured:", error);
            }
        } else {
            alert("Standard is required");
        }
    };

    const onSubjectSubmitClick = async () => {
        const standard = document.getElementById("standard_input").value.trim();
        const subject = document.getElementById("subject_input").value.trim();
        if (standard && subject) {
            try {
                await setDoc(doc(db, `classes-test/${uid}/standards/${standard}/subjects/${subject}`), { createdAt: new Date() });

                alert("subject " + subject + " is Successfully Added under standard " + standard);
                fetchSubjects(standard);
            } catch (error) {
                console.error('Error adding subject:', error);
                alert("Error Occured:", error);
            }
        } else {
            alert("Standard and Subject are required");
        }
    };

    const onUnitSubmitClick = async () => {
        const standard = document.getElementById("standard_input").value.trim();
        const subject = document.getElementById("subject_input").value.trim();
        const unit = document.getElementById("unit_input").value.trim();
        if (standard && subject && unit) {
            try {
                await setDoc(doc(db, `classes-test/${uid}/standards/${standard}/subjects/${subject}/units/${unit}`), { createdAt: new Date() });
                alert("unit " + unit + " is Successfully Added under subject " + subject + " : standard " + standard);
                fetchUnits(standard, subject);
            } catch (error) {
                console.error('Error adding unit:', error);
                alert("Error Occured:", error);
            }
        } else {
            alert("Standard, Subject, and Unit are required");
        }
    };

    const onShowContentClick = () => {
        console.log("onShowContentClick")
        //get standards from firestore
        fetchStandards();
        fetchSubjects(standards[0]); // assuming first standard is selected
        fetchUnits(standards[0], subjects[0]); // assuming first subject is selected
        console.log("onShowContentclick : fetch standards list  : " + standards);

    }

    const handleStandardClick = (standard) => {
        setSelectedStandard(standard);
        setShowStudentModal(false);
        setShowSubjectModal(false);
    };


    const handleEdit = async (type, standardId, index) => {
        if (type === "standard") {
            const oldStandardId = standards[index]; // Current standard ID
            const newStandardId = prompt("Enter the new ID for the standard:", oldStandardId);

            if (!newStandardId || newStandardId.trim() === "") {
                alert("Standard ID cannot be empty.");
                return;
            }

            if (newStandardId.trim() === oldStandardId) {
                console.log("No changes made to the standard ID.");
                return;
            }

            if (standards.includes(newStandardId.trim())) {
                alert(`Standard ID "${newStandardId}" already exists.`);
                return;
            }

            try {
                const userId = auth.currentUser.uid;

                // References to the old and new documents
                const oldStandardDocRef = doc(db, `classes-test/${userId}/standards`, oldStandardId);
                const newStandardDocRef = doc(db, `classes-test/${userId}/standards`, newStandardId.trim());

                // Fetch old document data
                const oldDocSnap = await getDoc(oldStandardDocRef);
                if (oldDocSnap.exists()) {
                    const oldData = oldDocSnap.data();

                    // Create a new document with the same data but a new ID
                    await setDoc(newStandardDocRef, oldData);

                    // Delete the old document
                    await deleteDoc(oldStandardDocRef);

                    // Update local state
                    setStandards((prevStandards) => {
                        const updatedStandards = [...prevStandards];
                        updatedStandards[index] = newStandardId.trim();
                        return updatedStandards;
                    });

                    console.log(`Standard ID successfully updated from "${oldStandardId}" to "${newStandardId}".`);
                } else {
                    console.error(`Old standard with ID "${oldStandardId}" does not exist.`);
                }
            } catch (error) {
                console.error("Error updating standard ID:", error);
            }


        } else if (type === "subject") {
            const collectionName = "subjects";
            console.log("Standard ID:", standardId, "Index:", index);

            // Get subjects for the standard as an object
            const items = subjects[standardId] || {};
            console.log("Subjects Object:", items);

            // Convert subjects object to an array for easier mapping
            const subjectsArray = Object.entries(items).map(([key, value]) => ({
                id: key,
                name: value,
            }));
            console.log("Subjects Array:", subjectsArray);

            // Get the old subject's name using the index
            const oldSubject = subjectsArray[index];
            if (!oldSubject) {
                console.error(`No subject found at index ${index}.`);
                return;
            }

            const oldId = oldSubject.name; // Old ID
            const oldName = oldSubject.name; // Old Name
            console.log("Old Subject ID:", oldId, "Old Subject Name:", oldName);

            // Prompt user to enter a new name
            const newName = prompt(`Enter the new name for the subject:`, oldName);

            if (!newName || newName.trim() === "") {
                alert(`Subject name cannot be empty.`);
                return;
            }

            if (newName.trim() === oldName) {
                console.log("No changes made to the subject name.");
                return;
            }

            if (Object.values(items).includes(newName.trim())) {
                alert(`Subject name "${newName}" already exists.`);
                return;
            }

            try {
                const userId = auth.currentUser.uid;

                const oldDocRef = doc(db, `classes-test/${userId}/standards/${standardId}/${collectionName}`, oldId);
                const newDocRef = doc(db, `classes-test/${userId}/standards/${standardId}/${collectionName}`, newName.trim());

                const oldDocSnap = await getDoc(oldDocRef);

                if (oldDocSnap.exists()) {
                    const oldData = oldDocSnap.data();

                    // Move data to the new ID and delete the old document
                    await setDoc(newDocRef, oldData);
                    await deleteDoc(oldDocRef);

                    // Update the state immediately
                    setSubjects((prevSubjects) => {
                        const updatedSubjects = { ...prevSubjects };
                        if (!updatedSubjects[standardId]) {
                            updatedSubjects[standardId] = {};
                        }

                        // Update subject name in the state
                        const updatedData = { ...updatedSubjects[standardId] };
                        delete updatedData[oldId]; // Remove the old ID
                        updatedData[newName.trim()] = oldData.name || newName.trim(); // Add the new name

                        updatedSubjects[standardId] = updatedData;
                        return updatedSubjects;
                    });

                    console.log(`Subject name updated successfully from "${oldName}" to "${newName}".`);
                } else {
                    console.error(`No such subject document found for ID "${oldId}".`);
                }
            } catch (error) {
                console.error(`Error updating subject name:`, error);
            }
        }

    };


    const handleDelete = async (type, standardId, id) => {
        const collectionName = type === "student" ? "students" : type === "subject" ? "subjects" : null;

        if (!collectionName) {
            console.error("Invalid type for deletion.");
            return;
        }

        try {
            const userId = auth.currentUser.uid;
            const docRef = doc(db, `classes-test/${userId}/standards/${standardId}/${collectionName}`, id);

            await deleteDoc(docRef);

            if (type === "student") {
                setStudents((prevStudents) => prevStudents.filter((studentId) => studentId !== id));
            } else if (type === "subject") {
                setSubjects((prevSubjects) => prevSubjects.filter((subjectId) => subjectId !== id));
            }

            console.log(`${type.charAt(0).toUpperCase() + type.slice(1)} with ID "${id}" has been deleted.`);
        } catch (error) {
            console.error(`Error deleting ${type}:`, error);
        }
    };




    const confirmDelete = (deleteCallback, itemType = "item") => {
        const confirmation = window.confirm(`Are you sure you want to delete this ${itemType}? This action cannot be undone.`);
        if (confirmation) {
            deleteCallback();
        }
    };



    const handleDeleteStandard = async (standard) => {
        try {
            // Remove from Firestore
            const userId = auth.currentUser.uid;
            const standardDocRef = doc(db, `classes-test/${userId}/standards`, standard);
            await deleteDoc(standardDocRef);

            // Remove locally
            setStandards((prevStandards) => prevStandards.filter((s) => s !== standard));

            console.log(`Standard "${standard}" successfully deleted.`);
        } catch (error) {
            console.error("Error deleting standard:", error);
        }
    };


    const handleAddClassClick = () => {
        setNewStandard("");
        setError("");
        setShowModal(true);
    };

    const toggleButtons = () => {
        setIsOpen(!isOpen);
    };

    const handleStandardChange = (e) => {
        const value = e.target.value;
        if (value === "" || (Number(value) >= 1 && Number(value) <= 12)) {
            setNewStandard(value);
            setError("");
        }
    };

    const handleAddStandard = () => {
        if (standards.includes(newStandard)) {
            setError("This class is already added");
            return;
        }
        if (newStandard) {
            setStandards([...standards, newStandard]);
            onAddClassClick(newStandard);
            //addNewcollection(standardCollName);
        }
        setShowModal(false);
        setNewStandard("");
    };


    const handleCloseModal = () => {
        setShowModal(false);
    };

    const handleDeleteItem = (type, index) => {
        const list = type === "student" ? students : subjects;
        const setList = type === "student" ? setStudents : setSubjects;

        setList((prev) => ({
            ...prev,
            [selectedStandard]: prev[selectedStandard].filter((_, i) => i !== index),
        }));
    };

    const handleAddStudent = () => {
        setShowStudentModal(true);
        setTempInput("");
    };
    const handleSubjectClick = (subject) => {
        setSelectedSubject(subject);
        console.log('setSelectedSubject', subject);

        fetchSubjectContents(subject);
    };

    const handleAddSubject = () => {
        setShowSubjectModal(true);
        setTempInput("");
    };

    const handleEditUnit = (unit) => {
        const newUnit = prompt("Edit unit number:", unit);
        if (newUnit && !isNaN(newUnit) && newUnit.trim() !== unit) {
            setStudyContents((prev) => ({
                ...prev,
                [selectedSubject]: prev[selectedSubject].map((item) =>
                    item.unit === unit ? { ...item, unit: newUnit.trim() } : item
                ),
            }));
        }
    };

    const fetchSubjectContents = async (subject) => {
        console.log('------------\nuid: ' + uid + '\nselectedStandard: ' + selectedStandard + '\nselectedSubject: ' + subject + '\n--------------------------------');

        try {
            const userId = auth.currentUser.uid;

            // Reference to the units collection under the subject
            const unitsRef = collection(db, `classes-test/${userId}/standards/${selectedStandard}/subjects/${subject}/units`);
            const unitsSnapshot = await getDocs(unitsRef);

            if (!unitsSnapshot.empty) {
                const unitContents = {};

                // Loop through all units to fetch their contents
                for (const unitDoc of unitsSnapshot.docs) {
                    const unitId = unitDoc.id; // Unit number
                    const contentsRef = collection(unitsRef, `${unitId}/contents`);
                    const contentsSnapshot = await getDocs(contentsRef);

                    const contents = contentsSnapshot.docs.map((contentDoc) => ({
                        id: contentDoc.id, // Timestamp ID
                        ...contentDoc.data(),
                    }));

                    unitContents[unitId] = contents; // Assign contents to respective unit

                    console.log('unitId : ' + unitId + ' contents : ' + contents);
                }

                // Update state with fetched data
                setStudyContents((prev) => ({
                    ...prev,
                    [subject]: unitContents,
                }));

                console.log('Fetched subject contents:', unitContents);
            } else {
                console.log('No units found for the selected subject.');
                setStudyContents((prev) => ({
                    ...prev,
                    [subject]: {}, // Clear existing contents for the subject
                }));
            }
        } catch (error) {
            console.error('Error fetching subject contents:', error);
        }
    };


    const handleEditContent = async (unitId, contentId, newContentValue, contentType) => {
        try {
            const userId = auth.currentUser.uid;
            const contentDocRef = doc(
                db,
                `classes-test/${userId}/standards/${selectedStandard}/subjects/${selectedSubject}/units/${unitId}/contents/${contentId}`
            );

            // If editing text content
            if (contentType === "text") {
                await setDoc(contentDocRef, { type: "text", content: newContentValue }, { merge: true });
                console.log("Text content updated successfully.");
            }
            // If editing an image
            else if (contentType === "image") {
                // Upload the new image to Firebase Storage
                const storageRef = ref(
                    storage,
                    `classes-test/${userId}/standards/${selectedStandard}/subjects/${selectedSubject}/units/${unitId}/contents/${contentId}`
                );
                const uploadTask = await uploadBytes(storageRef, newContentValue);
                const newImageUrl = await getDownloadURL(uploadTask.ref);

                // Update Firestore document with new image URL
                await setDoc(contentDocRef, { type: "image", content: newImageUrl }, { merge: true });
                console.log("Image content updated successfully.");
            }

            // Update local state
            setStudyContents((prevContents) => {
                const updatedContents = { ...prevContents };
                const unitContents = updatedContents[selectedSubject]?.[unitId] || [];
                updatedContents[selectedSubject][unitId] = unitContents.map((content) =>
                    content.id === contentId ? { ...content, content: newContentValue } : content
                );
                return updatedContents;
            });
        } catch (error) {
            console.error("Error editing content:", error);
        }
    };

    const handleDeleteContent = async (unitId, contentId, contentType) => {
        try {
            const userId = auth.currentUser.uid;

            // Reference to the Firestore document
            const contentDocRef = doc(
                db,
                `classes-test/${userId}/standards/${selectedStandard}/subjects/${selectedSubject}/units/${unitId}/contents/${contentId}`
            );

            // If the content is an image, delete it from Firebase Storage
            if (contentType === "image") {
                const storageRef = ref(
                    storage,
                    `classes-test/${userId}/standards/${selectedStandard}/subjects/${selectedSubject}/units/${unitId}/contents/${contentId}`
                );
                await deleteObject(storageRef);
                console.log("Image deleted from Firebase Storage.");
            }

            // Delete the Firestore document
            await deleteDoc(contentDocRef);
            console.log("Content deleted from Firestore.");

            // Update local state
            setStudyContents((prevContents) => {
                const updatedContents = { ...prevContents };
                updatedContents[selectedSubject][unitId] = updatedContents[selectedSubject][unitId].filter(
                    (content) => content.id !== contentId
                );
                return updatedContents;
            });
        } catch (error) {
            console.error("Error deleting content:", error);
        }
    };


    const updateSubjectContentsInFirestore = async (unit, updatedContents) => {
        const subjectDocRef = doc(db, `classes-test/${uid}/standards/${selectedStandard}/subjects`, selectedSubject);
        await updateDoc(subjectDocRef, {
            [`contents.${unit}`]: updatedContents,
        });
    };



    const handleDeleteUnit = (unit) => {
        setStudyContents((prev) => ({
            ...prev,
            [selectedSubject]: prev[selectedSubject].filter((item) => item.unit !== unit),
        }));
    };


    const handleContentTypeChange = (type) => {
        setNewContentType(type);  // Change content type (Text or Image)
    };

    const uploadStudyContentsToStandards = async () => {
        if (!auth.currentUser) {
            console.error("User is not authenticated.");
            return;
        }

        try {
            const userId = auth.currentUser.uid; // Get the authenticated user's ID
            const standardId = selectedStandard; // Replace with the selected standard ID
            const subjectData = studyContents; // studyContents contains subject-wise data

            console.log("subjectData: ", subjectData);

            // Process each subject in studyContents
            for (const subjectName in subjectData) {
                if (subjectData.hasOwnProperty(subjectName)) {
                    const newContents = subjectData[subjectName]; // Contents to be added

                    // Reference to the specific subject document in Firestore
                    const subjectDocRef = doc(
                        db,
                        `classes-test/${userId}/standards/${standardId}/subjects`,
                        subjectName
                    );

                    // Get the current subject data from Firestore
                    const subjectSnapshot = await getDoc(subjectDocRef);

                    let updatedContents = {};

                    if (subjectSnapshot.exists()) {
                        const subjectData = subjectSnapshot.data();
                        const existingContents = subjectData.contents || {};
                        updatedContents = { ...existingContents };
                    }

                    // Add or merge the new contents
                    newContents.forEach(({ unit, ...rest }) => {
                        if (!updatedContents[unit]) {
                            updatedContents[unit] = [];
                        }
                        updatedContents[unit].push(rest);
                    });

                    // Write the updated contents back to Firestore
                    await setDoc(subjectDocRef, { contents: updatedContents }, { merge: true });

                    console.log(`Contents updated for subject: '${subjectName}'`);
                }
            }

            console.log("Subjects updated successfully.");
        } catch (error) {
            console.error("Error uploading study contents to standards:", error);
        }
    };

    const handleTextContentSubmit = async () => {
        // Generate a timestamp for the document ID
        const timestamp = Date.now();

        // Ensure unit name is a valid number
        if (!unitName || isNaN(unitName) || unitName.trim() === "") {
            alert("Please enter a valid unit number (only numbers are allowed).");
            return;
        }

        // Ensure selectedSubject is valid
        if (!selectedSubject || selectedSubject.trim() === "") {
            console.error("Subject is not selected or invalid.");
            alert("Please select a valid subject before adding content.");
            return;
        }

        // Prompt user to enter content
        const content = prompt("Enter study content for this subject:");
        if (content && content.trim()) {
            try {
                const userId = auth.currentUser.uid; // Get current user's ID
                const standardId = selectedStandard; // Get the selected standard
                const subjectId = selectedSubject; // Get the selected subject
                const unitId = unitName.trim(); // Unit name as ID


                await setDoc(doc(db, `classes-test/${userId}/standards/${standardId}/subjects/${subjectId}/units/${unitId}`), { createdAt: new Date() });

                // Firestore path for the content document
                const contentDocRef = doc(
                    db,
                    `classes-test/${userId}/standards/${standardId}/subjects/${subjectId}/units/${unitId}/contents/${timestamp}`
                );

                // New content object
                const newContent = {
                    type: "text",
                    content: content.trim(),
                    createdAt: timestamp, // Adding timestamp for reference
                };

                // Add the content to Firestore
                await setDoc(contentDocRef, newContent);

                console.log("Text content successfully added to Firestore.");

                // Update local state
                setStudyContents((prevContents) => ({
                    ...prevContents,
                    [selectedSubject]: {
                        ...(prevContents[selectedSubject] || {}),
                        [unitId]: [
                            ...(prevContents[selectedSubject]?.[unitId] || []),
                            { id: timestamp, ...newContent }, // Add the new content with its ID
                        ],
                    },
                }));
            } catch (error) {
                console.error("Error adding text content to Firestore:", error);
            }
        }

        // Reset fields after submitting
        setNewContentType(null); // Reset content type
        setUnitName("");         // Reset unit name
    };


    const fetchContentsByUnit = async (unitId) => {
        const contentsRef = collection(
            db,
            `classes-test/${auth.currentUser.uid}/standards/${selectedStandard}/subjects/${selectedSubject}/units/${unitId}/contents`
        );

        const snapshot = await getDocs(contentsRef);
        const contents = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        return contents;
    };




    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
        }
    };

    const handleImageSubmit = async () => {
        // Generate a timestamp for the document ID
        const timestamp = Date.now();

        // Ensure unit name is a valid number
        if (!unitName || isNaN(unitName) || unitName.trim() === "") {
            alert("Please enter a valid unit number (only numbers are allowed).");
            return;
        }

        // Ensure an image is selected
        if (!image) {
            alert("Please select an image to upload.");
            return;
        }

        try {
            // Firebase storage path for the image
            const userId = auth.currentUser.uid;
            const storagePath = `classes-test/${userId}/standards/${selectedStandard}/subjects/${selectedSubject}/units/${unitName.trim()}/contents/${timestamp}`;
            const storageRef = ref(storage, storagePath);

            // Upload the image to Firebase Storage
            const uploadTask = await uploadBytes(storageRef, image);

            // Get the download URL for the uploaded image
            const imageUrl = await getDownloadURL(uploadTask.ref);

            console.log("Image uploaded successfully. URL:", imageUrl);

            // Firestore reference for the content document
            const contentDocRef = doc(
                db,
                `classes-test/${userId}/standards/${selectedStandard}/subjects/${selectedSubject}/units/${unitName.trim()}/contents/${timestamp}`
            );

            // New content object
            const newContent = {
                type: "image",
                content: imageUrl, // Store the image link as content
                createdAt: timestamp, // Optional timestamp for reference
            };

            // Add the content to Firestore
            await setDoc(contentDocRef, newContent);

            console.log("Image content successfully added to Firestore.");

            // Update local state (optional)
            setStudyContents((prevContents) => ({
                ...prevContents,
                [selectedSubject]: {
                    ...(prevContents[selectedSubject] || {}),
                    [unitName.trim()]: [
                        ...(prevContents[selectedSubject]?.[unitName.trim()] || []),
                        { id: timestamp, ...newContent }, // Add the new content with its ID
                    ],
                },
            }));
        } catch (error) {
            console.error("Error uploading image or adding content to Firestore:", error);
        }

        // Reset fields after submitting
        setNewContentType(null); // Reset content type
        setImage(null);          // Reset image
        setUnitName("");         // Reset unit name
    };




    const addToList = async (type) => {
        const list = type === "student" ? students : subjects;
        const setList = type === "student" ? setStudents : setSubjects;

        if (!tempInput.trim()) return; // Exit if input is empty

        const inputValue = tempInput.trim(); // Clean up input
        const collectionPath = `classes-test/${userId}/standards/${selectedStandard}/${type === "student" ? "students" : "subjects"}`;
        const newDocRef = doc(db, collectionPath, inputValue); // Reference for the new document

        try {
            // Add the new document to Firestore
            await setDoc(newDocRef, {}); // Empty object as document data

            console.log(`${type} added successfully:`, inputValue);

            // Update local state
            const updatedList = {
                ...list,
                [selectedStandard]: [
                    ...(list[selectedStandard] || []),
                    inputValue,
                ],
            };

            setList((prev) => ({
                ...prev,
                [selectedStandard]: updatedList[selectedStandard],
            }));
        } catch (error) {
            console.error(`Error adding ${type} to Firestore:`, error);
        }

        setTempInput(""); // Clear the input field
        setShowStudentModal(false);
        setShowSubjectModal(false);
    };


    //////////////////

    const onAddClassClick = async (nstandard) => {
        //const standard = document.getElementById("standard_input").value.trim();
        const standard = nstandard;
        if (standard) {
            try {
                await setDoc(doc(db, `classes-test/${uid}/standards/${standard}`), { createdAt: new Date() });

                alert("Standard " + standard + " is Successfully Added");
                fetchStandards();
            } catch (error) {
                console.error('Error adding standard:', error);
                alert("Error Occured:", error);
            }
        } else {
            alert("Standard is required");
        }
    };

    return (
        <div>

            <div className="App">

                {/* Header */}
                <header className="App-header">
                    <h1>Madrassa students monitoring app</h1>
                </header>

                {/* Main content */}
                <main className="main-content">
                    <div className="standards-grid">
                        {standards.map((standard, index) => (
                            <div className="standard-card" key={index}>
                                <span onClick={() => handleStandardClick(standard)}>Standard {standard}</span>
                                <div className="action-container">
                                    <FontAwesomeIcon
                                        icon={faEdit}
                                        className="edit-icon"
                                        onClick={() => handleEdit("standard", selectedStandard, index)}
                                    />
                                    <FontAwesomeIcon
                                        icon={faTrash}
                                        className="delete-icon"
                                        onClick={() => confirmDelete(() => handleDeleteStandard(standard), "standard")}
                                    />
                                </div>
                            </div>
                        ))}

                    </div>
                </main>

                {/* floating content */}
                <div className="floating-container">
                    {isOpen && (
                        <div className="sub-buttons">
                            <button className="sub-button" onClick={handleAddClassClick}>
                                Add Class
                            </button>
                            <button className="sub-button">Add Student</button>
                            <button className="sub-button">Add Study Content</button>
                        </div>
                    )}
                    <button className="floating-button" onClick={toggleButtons}>
                        +
                    </button>
                </div>

                {/* Add Class Modal */}
                {showModal && (
                    <div className="modal">
                        <div className="modal-content">
                            <h3>Add New Class</h3>
                            <input
                                type="number"
                                min="1"
                                max="12"
                                value={newStandard}
                                onChange={handleStandardChange}
                                onKeyDown={(e) => {
                                    if (["e", "+", "-", ".", ","].includes(e.key)) {
                                        e.preventDefault();
                                    }
                                }}
                                className="number-input"
                                placeholder="Enter a standard (1-12)"
                            />
                            <button className="modal-add-button" onClick={handleAddStandard}>
                                Add Standard
                            </button>
                            <button className="modal-close-button" onClick={handleCloseModal}>
                                Cancel
                            </button>
                            {error && <p className="error-text">{error}</p>}
                        </div>
                    </div>
                )}

                {/* Standard Modal */}
                {selectedStandard && (
                    <div className="modal">
                        <div className="modal-content">
                            <h3>Standard {selectedStandard}</h3>
                            <div className="modal-layout flex justify-center items-center" style={{ width: "80%" }}>
                                {/* Students Section */}
                                <div className="list-column">
                                    <h4>Students</h4>

                                    {(students[selectedStandard] || []).length === 0 ? (
                                        <h1>No Students Added Yet</h1>
                                    ) : (
                                        <div className="scrollable-list">
                                            {Object.keys(students[selectedStandard]).map((studentKey) => {
                                                const student = students[selectedStandard][studentKey]; // Access student details
                                                return (
                                                    <div className="list-item" key={studentKey}>
                                                        {student} {/* Display the student name */}
                                                        <div className="action-container">
                                                            <FontAwesomeIcon
                                                                icon={faEdit}
                                                                className="edit-icon"
                                                                onClick={() => handleEdit("student", selectedStandard, studentKey)} // Edit student action
                                                            />
                                                            <FontAwesomeIcon
                                                                icon={faTrash}
                                                                className="delete-icon"
                                                                onClick={() =>
                                                                    confirmDelete(() => handleDelete("student", studentKey), "student") // Delete student action
                                                                }
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    <button className="btn-button" onClick={handleAddStudent}>Add Student</button>
                                </div>

                                {/* Subjects Section */}
                                <div className="list-column">
                                    <h4>Subjects</h4>

                                    {(subjects[selectedStandard] || []).length === 0 ? (
                                        <h1>No Subjects Added Yet</h1>
                                    ) : (
                                        <div className="scrollable-list">
                                            {Object.keys(subjects[selectedStandard]).map((subjectKey) => {
                                                const subject = subjects[selectedStandard][subjectKey]; // Access subject details
                                                return (
                                                    <div
                                                        className="list-item"
                                                        key={subjectKey}
                                                        onClick={() => handleSubjectClick(subject)} // Optional: Handle subject click if needed
                                                    >
                                                        {subject} {/* Display the subject name */}
                                                        <div className="action-container">
                                                            <FontAwesomeIcon
                                                                icon={faEdit}
                                                                className="edit-icon"
                                                                onClick={(e) => {
                                                                    e.stopPropagation(); // Prevent list item click from triggering
                                                                    handleEdit("subject", selectedStandard, subjectKey); // Edit subject action
                                                                }}
                                                            />
                                                            <FontAwesomeIcon
                                                                icon={faTrash}
                                                                className="delete-icon"
                                                                onClick={(e) => {
                                                                    e.stopPropagation(); // Prevent list item click from triggering
                                                                    confirmDelete(() => handleDelete("subject", subjectKey), "subject"); // Delete subject action
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    <button className="btn-button" onClick={handleAddSubject}>Add Subject</button>
                                </div>

                            </div>

                            <button className="modal-close-button" onClick={() => setSelectedStandard(null)}>
                                Close
                            </button>
                        </div>
                    </div>
                )}


                {/* Subject Modal (Box like appearance) */}

                {selectedSubject && (
                    <div className="subject-modal">
                        <div className="modal-content">
                            <h3>{selectedSubject}</h3>

                            {/* Display Grouped Contents */}
                            <div className="scrollable-list">
                                {Object.entries(studyContents[selectedSubject] || {}).map(([unitId, contents]) => (
                                    <div key={unitId} className="unit-group">
                                        <div className="unit-header">
                                            <h4>Unit {unitId}</h4>
                                            <div className="action-container">
                                                <FontAwesomeIcon
                                                    icon={faEdit}
                                                    className="edit-icon"
                                                    onClick={() => handleEditUnit(unitId)}
                                                />
                                                <FontAwesomeIcon
                                                    icon={faTrash}
                                                    className="delete-icon"
                                                    onClick={() => confirmDelete(() => handleDeleteUnit(unitId), "unit")}
                                                />
                                            </div>
                                        </div>

                                        {contents.map((content, index) => (
                                            <div
                                                key={content.id}
                                                className={`content-item ${content.type === "text" ? "text-content" : "image-content"}`}
                                            >
                                                {content.type === "text" ? (
                                                    <p>{content.content}</p>
                                                ) : (
                                                    <img src={content.content} alt={`Unit ${unitId} content`} />
                                                )}
                                                <div className="action-container">
                                                    <FontAwesomeIcon
                                                        icon={faEdit}
                                                        className="edit-icon"
                                                        onClick={() => {
                                                            const newValue = prompt(
                                                                `Edit ${content.type === "text" ? "text" : "image"} content:`,
                                                                content.type === "text" ? content.content : ""
                                                            );
                                                            if (newValue) handleEditContent(unitId, content.id, newValue, content.type);
                                                        }}
                                                    />
                                                    <FontAwesomeIcon
                                                        icon={faTrash}
                                                        className="delete-icon"
                                                        onClick={() =>
                                                            confirmDelete(() => handleDeleteContent(unitId, content.id, content.type), "content")
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        ))}

                                    </div>
                                ))}
                            </div>


                            {/* Unit Name Input */}
                            <input
                                type="text"
                                value={unitName}
                                onChange={(e) => setUnitName(e.target.value)}
                                placeholder="Enter Unit Number (only numbers)"
                                className="unit-input"
                            />

                            {/* Content Type Selection */}
                            <div>
                                <button className='btn-button m-1' onClick={() => handleContentTypeChange("text")}>Add Text Content</button>
                                <button className='btn-button m-1' onClick={() => handleContentTypeChange("image")}>Add Image Content</button>
                            </div>

                            {newContentType === "text" ? (
                                <div>
                                    <button className='btn-button m-1' style={{ backgroundColor: "green" }} onClick={handleTextContentSubmit}>
                                        Submit Text Content
                                    </button>
                                    <button onClick={() => setNewContentType(null)}>Cancel</button>
                                </div>
                            ) : newContentType === "image" ? (
                                <div>
                                    <input type="file" accept="image/*" onChange={handleImageChange} />
                                    <button className='btn-button m-1' style={{ backgroundColor: "green" }} onClick={handleImageSubmit} disabled={!image}>
                                        Submit Image
                                    </button>
                                    <button onClick={() => setNewContentType(null)}>Cancel</button>
                                </div>
                            ) : null}

                            <button onClick={() => setSelectedSubject(null)} className="modal-close-button">
                                Close
                            </button>
                        </div>
                    </div>
                )}


                {/* Add Student/Subject Modal */}
                {(showStudentModal || showSubjectModal) && (
                    <div className="modal">
                        <div className="modal-content">
                            <h3>
                                Add {showStudentModal ? "Student" : "Subject"} for Standard {selectedStandard}
                            </h3>
                            <input
                                type="text"
                                value={tempInput}
                                onChange={(e) => setTempInput(e.target.value)}
                                placeholder={`Enter ${showStudentModal ? "Student" : "Subject"} Name`}
                                className="text-input"
                            />
                            <button className='btn-button' onClick={() => addToList(showStudentModal ? "student" : "subject")}>
                                Add
                            </button>
                            <button onClick={() => setShowStudentModal(false) || setShowSubjectModal(false)}>
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

            </div>

            <div style={{ display: "flex" }}>
                <div id='content_add_div'>
                    <div id="standard_div" style={{ marginTop: "20px" }}>
                        <input
                            style={{ padding: "10px" }}
                            id='standard_input'
                            type="number"
                            placeholder='Enter standard'
                            onFocus={handleStandardFocus}
                            list="standardsList"
                        />
                        <datalist id="standardsList">
                            {standards.map((standard, index) => <option key={index} value={standard} />)}
                        </datalist>
                        <button
                            style={{ padding: "10px", backgroundColor: "blue", color: "white" }}
                            onClick={onClassSubmitClick}
                        >
                            Submit
                        </button>
                    </div>

                    <div id='subject_div' style={{ marginTop: "20px" }}>
                        <input
                            style={{ padding: "10px" }}
                            id='subject_input'
                            type="text"
                            placeholder='Enter subject'
                            onFocus={handleSubjectFocus}
                            list="subjectsList"
                        />
                        <datalist id="subjectsList">
                            {/* Safely handle the subjects[selectedStandard] */}
                            {subjects[selectedStandard] &&
                                Object.values(subjects[selectedStandard]).map((subject, index) => (
                                    <option key={index} value={subject} />
                                ))}
                        </datalist>

                        <button
                            style={{ padding: "10px", backgroundColor: "blue", color: "white" }}
                            onClick={onSubjectSubmitClick}
                        >
                            Submit
                        </button>
                    </div>


                    <div id='unit_div' style={{ marginTop: "20px" }}>
                        <input
                            style={{ padding: "10px" }}
                            id='unit_input'
                            type="number"
                            placeholder='Enter Unit'
                            onFocus={handleUnitFocus}
                            list="unitsList"
                        />
                        <datalist id="unitsList">
                            {units.map((unit, index) => <option key={index} value={unit} />)}
                        </datalist>
                        <button
                            style={{ padding: "10px", backgroundColor: "blue", color: "white" }}
                            onClick={onUnitSubmitClick}
                        >
                            Submit
                        </button>
                    </div>
                    <div id='content_div' style={{ marginTop: "20px" }}>
                        <p style={{ fontSize: "30px", marginLeft: "10px" }}>Add content</p>
                        <hr style={{ margin: "10px" }}></hr>
                        <div>
                            <ImagePicker onImageSelect={handleImageSelect} />
                            {filePreview && (
                                <div style={{ marginTop: '20px' }}>
                                    <h3>Selected Image:</h3>
                                    <img
                                        src={filePreview}
                                        alt="Selected"
                                        style={{
                                            width: '200px',
                                            height: '200px',
                                            objectFit: 'cover',
                                            borderRadius: '10px',
                                            border: '1px solid #ccc',
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div id='content_view_div' style={{ marginTop: "20px", marginLeft: "30px" }}>
                    <p style={{ fontSize: "30px", marginLeft: "10px" }}>View Content</p>
                    <hr style={{ margin: "10px" }}></hr>
                    <div>
                        {/* Content will be displayed here */}
                        {/* <TestContentComponent /> */}
                        {/* get standards list from firestore*/}

                        <button onClick={onShowContentClick} >show contents in log</button>

                        {/* Main content */}
                        <main className="main-content">
                            <div className="standards-grid">
                                {standards.map((standard, index) => (

                                    <div className="standard-card" key={index}>
                                        <span >Standard {standard}</span>
                                        <div className="action-container">
                                            <FontAwesomeIcon
                                                icon={faEdit}
                                                className="edit-icon"
                                            // onClick={() => handleEdit("standard", index)}
                                            />
                                            <FontAwesomeIcon
                                                icon={faTrash}
                                                className="delete-icon"
                                            // onClick={() => confirmDelete(() => handleDeleteStandard(standard), "standard")}
                                            />
                                        </div>
                                    </div>


                                ))}
                            </div>
                        </main>

                        {/* get subjects list from firestore */}
                        {/* get units list from firestore */}
                        {/* get content list from firestore */}
                        {/* display content */}
                        {/* handle click event to open modal */}
                        {/* handle click event to delete content */}
                        {/* handle click event to edit content */}
                        {/* handle click event to download content */}
                        {/* handle click event to update content */}
                        {/* handle click event to open preview */}


                    </div>

                </div>
            </div>

        </div>
    );
}

export default TestContent;

import React, { useEffect, useState } from 'react';
import '../components/MainContent.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { faEdit } from '@fortawesome/free-solid-svg-icons';
import { auth, db } from '../firebase/setup'
import { addDoc, collection, getDocs, onSnapshot, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';




function MainContent() {
    const [isOpen, setIsOpen] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [standards, setStandards] = useState(["1", "2", "3", "4", "5"]);
    const [newStandard, setNewStandard] = useState("");
    const [error, setError] = useState("");
    const [selectedStandard, setSelectedStandard] = useState(null);
    const [students, setStudents] = useState({});
    const [subjects, setSubjects] = useState({});
    const [showStudentModal, setShowStudentModal] = useState(false);
    const [showSubjectModal, setShowSubjectModal] = useState(false);
    const [tempInput, setTempInput] = useState("");
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [studyContents, setStudyContents] = useState({});
    const [newContentType, setNewContentType] = useState(null);  // For text or image selection
    const [image, setImage] = useState(null);  // For storing selected image
    const [unitName, setUnitName] = useState("");  // For unit name input
    const [isLoading, setIsLoading] = useState(true); // Loading state

    let standardCollName = "standards";
    const userId = auth.currentUser.uid;

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (!auth.currentUser) {
                    console.error("User is not authenticated.");
                    return;
                }
                //const userId = auth.currentUser.uid; // Get the authenticated user's ID

                // Fetch documents from the user's standards collection
                const querySnapshot = await getDocs(collection(db, `users/${userId}/${standardCollName}`));

                const data = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));

                querySnapshot.docs.map((doc) => {
                    console.log("doc.id", doc.id, "\ndoc.data() : ", doc.data());
                })

                console.log("data:", data);

                // Extract the `standard` key from each document
                const standardsList = data.map((item) => item.standard);
                console.log("standards:", standardsList);

                setStandards(standardsList);

                setIsLoading(false); // Initialization complete
            } catch (error) {
                console.error("Error fetching data: " + error);
                setIsLoading(false);
            }
        };

        fetchData();
    }, [standardCollName]);

    useEffect(() => {
        if (!selectedStandard) return; // Exit if no standard is selected

        const fetchStandardData = async () => {
            try {
                if (!auth.currentUser) {
                    console.error("User is not authenticated.");
                    return;
                }

                // Reference to the selected standard document
                const docRef = doc(db, `users/${userId}/${standardCollName}`, selectedStandard);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    console.log("Fetched data: ", data);

                    // Update the state with fetched data
                    setStudents((prev) => ({
                        ...prev,
                        [selectedStandard]: data.students ? Object.keys(data.students) : [], // Extract student names as array
                    }));

                    setSubjects((prev) => ({
                        ...prev,
                        [selectedStandard]: data.subjects ? Object.keys(data.subjects) : [], // Extract subject names as array
                    }));

                    console.log("Students for selectedStandard:", data.students);
                    console.log("Subjects for selectedStandard:", data.subjects);
                } else {
                    console.log("No such document for the selected standard!");
                }
            } catch (error) {
                console.error("Error fetching standard data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStandardData();
    }, [selectedStandard, standardCollName, userId]);




    const toggleButtons = () => {
        setIsOpen(!isOpen);
    };

    const handleAddClassClick = () => {
        setNewStandard("");
        setError("");
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
    };

    const handleStandardChange = (e) => {
        const value = e.target.value;
        if (value === "" || (Number(value) >= 1 && Number(value) <= 12)) {
            setNewStandard(value);
            setError("");
        }
    };

    const addNewcollection = async (collectionName) => {
        try {
            if (!userId) {
                console.error("User ID is required.");
                return;
            }
            if (!newStandard) {
                console.error("Standard is required.");
                return;
            }

            // Create a reference to the user's collection and document
            const docRef = doc(db, `users/${userId}/${collectionName}`, newStandard); // Structure: users/{userId}/{collectionName}/{standard}

            // Add a new document with specified fields
            await setDoc(docRef, {
                standard: newStandard,
                subjects: [],
                students: [],
                createdAt: new Date(),
            });

            console.log("Document written with ID:", newStandard);
        } catch (error) {
            console.error("Error adding document: ", error);
        }
    };

    const handleAddStandard = () => {
        if (standards.includes(newStandard)) {
            setError("This class is already added");
            return;
        }
        if (newStandard) {
            setStandards([...standards, newStandard]);
            addNewcollection(standardCollName);
        }
        setShowModal(false);
        setNewStandard("");
    };

    const handleStandardClick = (standard) => {
        setSelectedStandard(standard);
        setShowStudentModal(false);
        setShowSubjectModal(false);
    };

    const handleAddStudent = () => {
        setShowStudentModal(true);
        setTempInput("");
    };

    const handleAddSubject = () => {
        setShowSubjectModal(true);
        setTempInput("");
    };

    const handleSubjectClick = (subject) => {
        setSelectedSubject(subject);
    };

    // const testDocumentFetch = async () => {
    //     const docRef = doc(db, "standards", "3"); // Replace "3" with the actual ID
    //     const docSnap = await getDoc(docRef);

    //     if (docSnap.exists()) {
    //         console.log("Document data:", docSnap.data());
    //     } else {
    //         console.log("Document does not exist!");
    //     }
    // };

    // testDocumentFetch();


    const addToList = async (type) => {
        const list = type === "student" ? students : subjects;
        const setList = type === "student" ? setStudents : setSubjects;

        if (!tempInput.trim()) return;

        const inputValue = tempInput.trim();

        // Update local state
        const updatedList = {
            ...list,
            [selectedStandard]: {
                ...(list[selectedStandard] || {}),
                [inputValue]: null, // For subjects, we store them directly as keys with `null` values
            },
        };
        console.log(updatedList);

        setList((prev) => ({
            ...prev,
            [selectedStandard]: updatedList[selectedStandard],
        }));

        setSubjects((prev) => ({
            ...prev,
            [selectedStandard]: updatedList[selectedStandard],
        }));
        console.log("list: "+subjects[selectedStandard]);

        try {
            const collectionName = "standards";
            const docRef = doc(db, `users/${userId}/${collectionName}`, selectedStandard);

            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) {
                console.error(`Document with ID ${selectedStandard} does not exist.`);
                return;
            }

            const fieldToUpdate = type === "student" ? "students" : "subjects";

            if (type === "student") {
                // Add student to Firestore
                await updateDoc(docRef, {
                    [`${fieldToUpdate}.${inputValue}`]: null,
                });
            } else if (type === "subject") {
                // Add subject to Firestore
                await updateDoc(docRef, {
                    [`${fieldToUpdate}.${inputValue}`]: null,
                });
            }

            console.log(`${fieldToUpdate} updated successfully in Firestore.`);
        } catch (error) {
            console.error("Error updating document in Firestore: ", error);
        }

        setTempInput(""); // Clear input field
        setShowStudentModal(false);
        setShowSubjectModal(false);
    };



    const handleAddStudyContent = (subject) => {
        setSelectedSubject(subject);
        setNewContentType(null);  // Reset content type
        setUnitName(""); // Reset unit name
    };

    const handleContentTypeChange = (type) => {
        setNewContentType(type);  // Change content type (Text or Image)
    };

    useEffect(() => {
        console.log("Updated studyContents:", studyContents);
    }, [studyContents]);

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

            // Reference to the specific standard document in the subcollection
            const standardDocRef = doc(db, `users/${userId}/standards`, standardId);

            // Get the current subjects data from Firestore
            const standardSnapshot = await getDoc(standardDocRef);

            if (!standardSnapshot.exists()) {
                console.error("Standard document does not exist.");
                return;
            }

            const currentSubjects = standardSnapshot.data().subjects || {};

            // Process each subject in studyContents
            for (const subjectName in subjectData) {
                if (subjectData.hasOwnProperty(subjectName)) {
                    const newContents = subjectData[subjectName]; // Contents to be added

                    // Initialize or merge contents for the subject
                    const subjectEntry = currentSubjects[subjectName] || { contents: {} };
                    const existingContents = subjectEntry.contents || {};
                    const updatedContents = { ...existingContents };

                    newContents.forEach(({ unit, ...rest }) => {
                        if (!updatedContents[unit]) {
                            updatedContents[unit] = [];
                        }
                        updatedContents[unit].push(rest);
                    });

                    // Update the subject with the merged contents
                    currentSubjects[subjectName] = { contents: updatedContents };

                    console.log(`Contents updated for subject: '${subjectName}'`);
                }
            }

            // Write the updated subjects data back to Firestore
            await updateDoc(standardDocRef, { subjects: currentSubjects });

            console.log("Subjects updated successfully.");
        } catch (error) {
            console.error("Error uploading study contents to standards:", error);
        }
    };


    const handleTextContentSubmit = () => {
        // Ensure unit name is a valid number
        if (!unitName || isNaN(unitName) || unitName.trim() === "") {
            alert("Please enter a valid unit number (only numbers are allowed).");
            return;
        }

        const content = prompt("Enter study content for this subject:");
        if (content && content.trim()) {
            // Correctly update studyContents state without mutation
            setStudyContents((prevContents) => ({
                ...prevContents,
                [selectedSubject]: [
                    ...(prevContents[selectedSubject] || []),
                    { type: "text", content: content.trim(), unit: unitName.trim() },
                ],
            }));
            console.log("study contents updated : " + studyContents)
            console.log("unit  : " + unitName + " content : " + content);
            uploadStudyContentsToStandards()
        }
        setNewContentType(null);  // Reset content type after submitting
        setUnitName(""); // Reset unit name after submitting

    };

    const handleImageSubmit = () => {
        // Ensure unit name is a valid number
        if (!unitName || isNaN(unitName) || unitName.trim() === "") {
            alert("Please enter a valid unit number (only numbers are allowed).");
            return;
        }

        if (image) {
            setStudyContents((prevContents) => ({
                ...prevContents,
                [selectedSubject]: [
                    ...(prevContents[selectedSubject] || []),
                    { type: "image", content: URL.createObjectURL(image), unit: unitName.trim() },
                ],
            }));
        }
        setNewContentType(null);  // Reset content type after submitting
        setImage(null);  // Reset image after submission
        setUnitName(""); // Reset unit name after submitting
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
        }
    };

    const confirmDelete = (deleteCallback, itemName) => {
        const confirmed = window.confirm(`Are you sure you want to delete this ${itemName}?`);
        if (confirmed) deleteCallback();
    };


    const handleDeleteStandard = (standard) => {
        setStandards(standards.filter((s) => s !== standard));
        setStudents((prev) => {
            const updated = { ...prev };
            delete updated[standard];
            return updated;
        });
        setSubjects((prev) => {
            const updated = { ...prev };
            delete updated[standard];
            return updated;
        });
    };


    const handleEdit = (type, index) => {
        const currentValue =
            type === "standard"
                ? standards[index]
                : type === "student"
                    ? students[selectedStandard][index]
                    : subjects[selectedStandard][index];

        const newValue = prompt(`Edit ${type} name:`, currentValue);

        if (newValue && newValue.trim() !== currentValue.trim()) {
            if (type === "standard") {
                // Update standards
                setStandards((prev) => prev.map((s, i) => (i === index ? newValue.trim() : s)));

                // Update students, subjects, and studyContents keys
                setStudents((prev) => {
                    const updated = { ...prev };
                    updated[newValue.trim()] = updated[currentValue];
                    delete updated[currentValue];
                    return updated;
                });

                setSubjects((prev) => {
                    const updated = { ...prev };
                    updated[newValue.trim()] = updated[currentValue];
                    delete updated[currentValue];
                    return updated;
                });

                setStudyContents((prev) => {
                    const updated = { ...prev };
                    updated[newValue.trim()] = updated[currentValue];
                    delete updated[currentValue];
                    return updated;
                });
            } else if (type === "student") {
                // Update students array
                setStudents((prev) => ({
                    ...prev,
                    [selectedStandard]: prev[selectedStandard].map((s, i) =>
                        i === index ? newValue.trim() : s
                    ),
                }));
            } else if (type === "subject") {
                // Update subjects array and studyContents
                setSubjects((prev) => ({
                    ...prev,
                    [selectedStandard]: prev[selectedStandard].map((s, i) =>
                        i === index ? newValue.trim() : s
                    ),
                }));

                setStudyContents((prev) => {
                    const updated = { ...prev };
                    updated[newValue.trim()] = updated[currentValue];
                    delete updated[currentValue];
                    return updated;
                });
            }
        }
    };


    const handleDeleteItem = (type, index) => {
        const list = type === "student" ? students : subjects;
        const setList = type === "student" ? setStudents : setSubjects;

        setList((prev) => ({
            ...prev,
            [selectedStandard]: prev[selectedStandard].filter((_, i) => i !== index),
        }));
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


    const handleEditContent = (unit, index) => {
        // Step 1: Retrieve contents for the selected subject
        const contentList = studyContents[selectedSubject] || [];
        console.log("Content List for selectedSubject:", contentList);

        // Step 2: Filter contents for the specified unit
        const unitContents = contentList.filter((item) => item.unit === unit);
        console.log("Contents for Unit:", unitContents);

        if (unitContents.length === 0) {
            console.error(`No contents found for unit: ${unit}`);
            return;
        }

        // Step 3: Get the item at the specified index within the unit
        const currentItem = unitContents[index];
        console.log("Current Item:", currentItem);

        if (!currentItem) {
            console.error(`No item found at index: ${index} for unit: ${unit}`);
            return;
        }

        // Step 4: Ask user if they want to change the content type
        const newType = prompt(
            `Current content is a ${currentItem.type}. Do you want to change the type? Enter "text" for Text or "image" for Image, or press Cancel to keep the same type.`,
            currentItem.type
        );

        if (newType && newType.trim().toLowerCase() !== currentItem.type) {
            if (newType.trim().toLowerCase() === "text") {
                const newText = prompt("Enter new text content:");
                if (newText && newText.trim()) {
                    setStudyContents((prev) => ({
                        ...prev,
                        [selectedSubject]: prev[selectedSubject].map((item) =>
                            item.unit === unit && item === currentItem
                                ? { ...item, type: "text", content: newText.trim() }
                                : item
                        ),
                    }));
                }
            } else if (newType.trim().toLowerCase() === "image") {
                const fileInput = document.createElement("input");
                fileInput.type = "file";
                fileInput.accept = "image/*";
                fileInput.onchange = (event) => {
                    const file = event.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = () => {
                            setStudyContents((prev) => ({
                                ...prev,
                                [selectedSubject]: prev[selectedSubject].map((item) =>
                                    item.unit === unit && item === currentItem
                                        ? { ...item, type: "image", content: reader.result }
                                        : item
                                ),
                            }));
                        };
                        reader.readAsDataURL(file);
                    }
                };
                fileInput.click();
            } else {
                alert("Invalid type entered. No changes were made.");
            }
            return; // Exit after changing type
        }

        // Step 5: Handle editing based on the current type
        if (currentItem.type === "text") {
            const newText = prompt("Edit text content:", currentItem.content);
            if (newText && newText.trim() !== currentItem.content) {
                setStudyContents((prev) => ({
                    ...prev,
                    [selectedSubject]: prev[selectedSubject].map((item) =>
                        item.unit === unit && item === currentItem
                            ? { ...item, content: newText.trim() }
                            : item
                    ),
                }));
            }
        } else if (currentItem.type === "image") {
            const fileInput = document.createElement("input");
            fileInput.type = "file";
            fileInput.accept = "image/*";
            fileInput.onchange = (event) => {
                const file = event.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = () => {
                        setStudyContents((prev) => ({
                            ...prev,
                            [selectedSubject]: prev[selectedSubject].map((item) =>
                                item.unit === unit && item === currentItem
                                    ? { ...item, content: reader.result }
                                    : item
                            ),
                        }));
                    };
                    reader.readAsDataURL(file);
                }
            };
            fileInput.click();
        } else {
            console.error(`Unsupported content type: ${currentItem.type}`);
        }
    };


    const handleDeleteContent = (unit, index) => {
        console.log("unit:", unit);
        console.log("index:", index);

        setStudyContents((prev) => {
            // Step 1: Retrieve the full content list for the selected subject
            const contentList = prev[selectedSubject] || [];
            console.log("Content List before deletion:", contentList);

            // Step 2: Filter contents by unit
            const unitContents = contentList.filter((item) => item.unit === unit);
            console.log("Filtered Contents for Unit:", unitContents);

            // Step 3: Remove the item at the specified index within the unit
            const updatedUnitContents = unitContents.filter((_, i) => i !== index);
            console.log("Updated Contents for Unit after deletion:", updatedUnitContents);

            // Step 4: Merge the updated unit contents back with the other contents
            const updatedContents = [
                ...contentList.filter((item) => item.unit !== unit), // Keep other units' content
                ...updatedUnitContents, // Add the updated unit's content
            ];

            console.log("Final Updated Content List:", updatedContents);

            // Step 5: Update the state
            return {
                ...prev,
                [selectedSubject]: updatedContents,
            };
        });
    };


    const handleDeleteUnit = (unit) => {
        setStudyContents((prev) => ({
            ...prev,
            [selectedSubject]: prev[selectedSubject].filter((item) => item.unit !== unit),
        }));
    };

    // Render loading spinner if still initializing
    if (isLoading) {
        return (
            <section className="bg-emerald-500 flex items-center justify-center h-screen">
                <div className="loader"></div>
            </section>
        );
    }

    return (

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
                                    onClick={() => handleEdit("standard", index)}
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
                                                            onClick={() => handleEdit("student", studentKey)}
                                                        />
                                                        <FontAwesomeIcon
                                                            icon={faTrash}
                                                            className="delete-icon"
                                                            onClick={() =>
                                                                confirmDelete(() => handleDeleteItem("student", studentKey), "student")
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
                                                    onClick={() => handleSubjectClick(subjectKey)}
                                                >
                                                    {subject} {/* Display the subject name */}
                                                    <div className="action-container">
                                                        <FontAwesomeIcon
                                                            icon={faEdit}
                                                            className="edit-icon"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleEdit("subject", subjectKey);
                                                            }}
                                                        />
                                                        <FontAwesomeIcon
                                                            icon={faTrash}
                                                            className="delete-icon"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                confirmDelete(() => handleDeleteItem("subject", subjectKey), "subject");
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
                            {/* Group contents by unit */}
                            {Object.entries(
                                (studyContents[selectedSubject] || [])
                                    .reduce((acc, content) => {
                                        acc[content.unit] = acc[content.unit] || [];
                                        acc[content.unit].push(content);
                                        return acc;
                                    }, {})
                            ).map(([unit, contents]) => (

                                <div key={unit} className="unit-group">
                                    <div className="unit-header">
                                        <h4>Unit {unit}</h4>
                                        <div className="action-container">
                                            <FontAwesomeIcon
                                                icon={faEdit}
                                                className="edit-icon"
                                                onClick={() => handleEditUnit(unit)}
                                            />
                                            <FontAwesomeIcon
                                                icon={faTrash}
                                                className="delete-icon"
                                                onClick={() =>
                                                    confirmDelete(() => handleDeleteUnit(unit), "unit")
                                                }
                                            />
                                        </div>
                                    </div>

                                    {contents.map((content, index) => (
                                        <div key={index} className={`content-item ${content.type === "text" ? "text-content" : "image-content"}`}>
                                            {content.type === "text" ? (
                                                <p className="content-item">{content.content}</p>
                                            ) : (
                                                <img
                                                    src={content.content}
                                                    alt={`Unit ${unit} content`}
                                                    className="content-image"
                                                />
                                            )}
                                            <div className="action-container">
                                                <FontAwesomeIcon
                                                    icon={faEdit}
                                                    className="edit-icon"
                                                    onClick={() => handleEditContent(unit, index)}
                                                />
                                                <FontAwesomeIcon
                                                    icon={faTrash}
                                                    className="delete-icon"
                                                    onClick={() =>
                                                        confirmDelete(() => handleDeleteContent(unit, index), "content")
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
                                <button className='btn-button m-1' style={{ backgroundColor: "green" }}
                                    onClick={handleTextContentSubmit}>
                                    {/* onClick={handleTextContentSubmit}> */}
                                    Submit Text Content</button>
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
    );
}

export default MainContent;

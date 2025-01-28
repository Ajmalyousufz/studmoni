import React, { useState } from "react";
import { auth, db, storage } from "../firebase/setup.js";
import { doc, setDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

const ImagePicker = ({ onSubmit }) => {
    const [filePreview, setFilePreview] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadComplete, setUploadComplete] = useState(false);
    const inputRef = React.useRef();
    const [showConfirmation, setShowConfirmation] = useState(false);

    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setFilePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerFileInput = () => {
        inputRef.current.click();
    };

    const handleImageSubmit = () => {
        if (!selectedFile) {
            alert("No image selected!");
            return;
        }
        setIsUploading(true);
        setUploadComplete(false);

        const storageRef = ref(storage, `images/${selectedFile.name}`);
        const uploadTask = uploadBytesResumable(storageRef, selectedFile);

        uploadTask.on(
            "state_changed",
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setUploadProgress(progress);
            },
            (error) => {
                console.error("Error during upload:", error);
                setIsUploading(false);
            },
            async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                setIsUploading(false);
                setUploadComplete(true);
                setFilePreview(null);
                onSubmit(downloadURL);

                // Show confirmation box
                setShowConfirmation(true);

                // Hide confirmation box after 3 seconds
                setTimeout(() => {
                    setShowConfirmation(false);
                }, 3000);

                alert('File uploaded and database updated successfully!');
            }
        );
    };

    return (
        <div style={{ textAlign: "center" }}>
            <button onClick={triggerFileInput} style={{ padding: "10px 20px", cursor: "pointer" }}>
                Pick Image
            </button>
            <input
                type="file"
                ref={inputRef}
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: "none" }}
            />
            {filePreview && (
                <div style={{ marginTop: "20px" }}>
                    <img
                        src={filePreview}
                        alt="Selected"
                        style={{
                            width: "200px",
                            height: "200px",
                            objectFit: "cover",
                            borderRadius: "10px",
                            border: "1px solid #ccc",
                        }}
                    />
                    <button
                        onClick={() => setFilePreview(null)}
                        style={{ display: "block", margin: "10px auto", cursor: "pointer" }}
                    >
                        Clear Preview
                    </button>
                </div>
            )}
            <button
                onClick={handleImageSubmit}
                disabled={isUploading}
                style={{
                    marginTop: "10px",
                    padding: "10px 20px",
                    backgroundColor: isUploading ? "#ccc" : "#28a745",
                    color: "#fff",
                    border: "none",
                    cursor: isUploading ? "not-allowed" : "pointer",
                    borderRadius: "5px",
                }}
            >
                {isUploading ? `Uploading: ${uploadProgress.toFixed(0)}%` : "Submit Image"}
            </button>
            {uploadComplete && <div style={{ marginTop: "10px", color: "green" }}>Upload Complete!</div>}
            
            {showConfirmation && (
                    <div style={{ marginTop: '20px', color: 'green', fontWeight: 'bold', fontSize: '18px' }}>
                        ✅ OK! File uploaded and saved successfully.
                    </div>
                )}
        </div>
    );
};

const ToggleDivs = () => {
    const [activeTab, setActiveTab] = useState("text");
    const [textInput, setTextInput] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const uid = auth.currentUser?.uid || "testUser"; // Replace with actual UID logic

    const handleTabClick = (tab) => {
        setActiveTab(tab);
    };

    const handleTextSubmit = () => {
        const standard = document.getElementById("standard_input").value.trim();
        const subject = document.getElementById("subject_input").value.trim();
        const unit = document.getElementById("unit_input").value.trim();

        if (!standard || !subject || !unit || !textInput.trim()) {
            alert("Please fill in all fields.");
            return;
        }

        setIsSubmitting(true);
        addContent(uid, standard, subject, unit, textInput.trim(), "text").then(() => {
            setTextInput("");
            setIsSubmitting(false);
            
            alert('File uploaded and database updated successfully!');
        });
    };

    const addContent = async (classId, standardId, subjectName, unitName, content, type) => {
        try {
            const unitRef = doc(
                db,
                `classes-test/${classId}/standards/${standardId}/subjects/${subjectName}/units/${unitName}/contents/${Date.now()}`
            );
            await setDoc(unitRef, { content, type });
            console.log(`Content added successfully under ${unitName}.`);
        } catch (error) {
            console.error("Error adding content:", error);
        }
    };

    const handleImageSubmit = (downloadURL) => {
        const standard = document.getElementById("standard_input").value.trim();
        const subject = document.getElementById("subject_input").value.trim();
        const unit = document.getElementById("unit_input").value.trim();

        if (!standard || !subject || !unit) {
            alert("Please fill in all fields.");
            return;
        }

        addContent(uid, standard, subject, unit, downloadURL, "image");
    };

    const commonDivStyle = {
        padding: "20px",
        border: "1px solid #ccc",
        borderRadius: "5px",
        width: "400px",
        margin: "0 auto",
    };

    return (
        <div style={{ textAlign: "center", marginTop: "20px" }}>
            <div style={{ display: "flex", justifyContent: "center", gap: "20px", alignItems: "center" }}>
                {["text", "image"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => handleTabClick(tab)}
                        style={{
                            padding: "10px 20px",
                            cursor: "pointer",
                            backgroundColor: activeTab === tab ? "#007BFF" : "#f0f0f0",
                            color: activeTab === tab ? "#fff" : "#000",
                        }}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>
            <div style={{ marginTop: "20px" }}>
                {activeTab === "text" && (
                    <div style={commonDivStyle}>
                        <h3>Text Input</h3>
                        <input
                            type="text"
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            placeholder="Enter some text"
                            style={{
                                padding: "10px",
                                width: "100%",
                                margin: "10px 0",
                                borderRadius: "5px",
                            }}
                        />
                        <button
                            onClick={handleTextSubmit}
                            disabled={isSubmitting}
                            style={{
                                padding: "10px 20px",
                                backgroundColor: isSubmitting ? "#ccc" : "#28a745",
                                color: "#fff",
                                border: "none",
                                cursor: isSubmitting ? "not-allowed" : "pointer",
                                borderRadius: "5px",
                            }}
                        >
                            {isSubmitting ? "Submitting..." : "Submit Text"}
                        </button>
                    </div>
                )}
                {activeTab === "image" && (
                    <div style={commonDivStyle}>
                        <h3>Image Picker</h3>
                        <ImagePicker onSubmit={handleImageSubmit} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ToggleDivs;

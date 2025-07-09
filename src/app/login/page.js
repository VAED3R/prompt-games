'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, doc, setDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import styles from './page.module.css';

const RegistrationPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    semester: '',
    branch: '',
    email: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.semester.trim()) {
      newErrors.semester = 'Semester is required';
    }
    
    if (!formData.branch.trim()) {
      newErrors.branch = 'Branch is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSubmitting(true);
      
      try {
        // Check if user with this email already exists
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', formData.email.trim().toLowerCase()));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          // User already exists - load their data
          const existingUser = querySnapshot.docs[0];
          const existingUserData = existingUser.data();
          
          console.log('User already exists, loading existing data:', existingUserData);
          
          // Store existing user ID in localStorage
          localStorage.setItem('userId', existingUserData.id.toString());
          
          alert('Welcome back! Loading your existing data...');
          
          // Reset form
          setFormData({
            name: '',
            semester: '',
            branch: '',
            email: ''
          });
          
          // Redirect to ai-charades page
          router.push('/ai-charades');
          
        } else {
          // Create new user
          const userId = Math.floor(Math.random() * 1000000) + 1; // Random number between 1 and 1000000
          
          console.log('Generated userId:', userId);
          
          // Add user data to Firestore users collection with custom ID
          const userData = {
            id: userId,
            name: formData.name.trim(),
            semester: parseInt(formData.semester),
            branch: formData.branch.trim(),
            email: formData.email.trim().toLowerCase()
          };

          console.log('User data to save:', userData);

          // Use setDoc with custom ID instead of addDoc
          const docRef = await setDoc(doc(db, 'users', userId.toString()), userData);
          
          console.log('User registered successfully with ID:', userId);
          console.log('Document reference:', docRef);
          
          // Store user ID in localStorage for game progress tracking
          localStorage.setItem('userId', userId.toString());
          console.log('UserId stored in localStorage:', userId.toString());
          
          alert('Registration successful! Welcome to the game!');
          
          // Reset form after successful submission
          setFormData({
            name: '',
            semester: '',
            branch: '',
            email: ''
          });
          
          // Redirect to ai-charades page
          router.push('/ai-charades');
        }
        
      } catch (error) {
        console.error('Error during registration:', error);
        alert('Registration failed. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formContainer}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            Game Registration
          </h1>
          <p className={styles.subtitle}>
            Register to start your gaming journey
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="name" className={styles.label}>
              Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
              placeholder="Enter your full name"
              disabled={isSubmitting}
            />
            {errors.name && <span className={styles.errorText}>{errors.name}</span>}
          </div>

          <div className={styles.row}>
            <div className={styles.inputGroup}>
              <label htmlFor="semester" className={styles.label}>
                Semester
              </label>
              <select
                id="semester"
                name="semester"
                value={formData.semester}
                onChange={handleInputChange}
                className={`${styles.input} ${styles.select} ${errors.semester ? styles.inputError : ''}`}
                disabled={isSubmitting}
              >
                <option value="">Select Semester</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="6">6</option>
                <option value="7">7</option>
                <option value="8">8</option>
              </select>
              {errors.semester && <span className={styles.errorText}>{errors.semester}</span>}
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="branch" className={styles.label}>
                Branch
              </label>
              <input
                type="text"
                id="branch"
                name="branch"
                value={formData.branch}
                onChange={handleInputChange}
                className={`${styles.input} ${errors.branch ? styles.inputError : ''}`}
                placeholder="Enter your branch name"
                disabled={isSubmitting}
              />
              {errors.branch && <span className={styles.errorText}>{errors.branch}</span>}
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.label}>
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
              placeholder="Enter your email address"
              disabled={isSubmitting}
            />
            {errors.email && <span className={styles.errorText}>{errors.email}</span>}
          </div>

          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Registering...' : 'Register for Game'}
          </button>
        </form>

        <div className={styles.footer}>
          <p className={styles.switchText}>
            Ready to start playing? Complete your registration above!
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegistrationPage;

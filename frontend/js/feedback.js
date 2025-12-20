// API Base URL (Node mailer service)
const API_URL = 'http://localhost:3000/api';

// DOM Elements
const feedbackForm = document.getElementById('feedbackForm');
const starRating = document.getElementById('starRating');
const ratingInput = document.getElementById('rating');
const ratingText = document.getElementById('ratingText');
const successMessage = document.getElementById('successMessage');
const successText = document.getElementById('successText');
const submitBtn = document.getElementById('submitBtn');

// Rating state
let selectedRating = 0;

// Initialize star rating
function initStarRating() {
    const stars = document.querySelectorAll('.star');
    
    stars.forEach(star => {
        star.addEventListener('click', () => {
            selectedRating = parseInt(star.dataset.rating);
            ratingInput.value = selectedRating;
            updateStars();
            updateRatingText();
        });

        star.addEventListener('mouseenter', () => {
            const hoverRating = parseInt(star.dataset.rating);
            highlightStars(hoverRating);
        });
    });

    starRating.addEventListener('mouseleave', () => {
        updateStars();
    });
}

function highlightStars(rating) {
    const stars = document.querySelectorAll('.star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

function updateStars() {
    highlightStars(selectedRating);
}

function updateRatingText() {
    const texts = {
        1: 'Poor',
        2: 'Fair',
        3: 'Good',
        4: 'Very Good',
        5: 'Excellent'
    };
    ratingText.textContent = selectedRating > 0 ? texts[selectedRating] : 'Select a rating';
}

// Form submission
feedbackForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (selectedRating === 0) {
        alert('Please select a rating');
        return;
    }

    // Get form data
    const formData = {
        email: document.getElementById('email').value.trim(),
        rating: selectedRating,
        packageDamaged: document.querySelector('input[name="packageDamaged"]:checked').value,
        onTime: document.querySelector('input[name="onTime"]:checked').value,
        feedback: document.getElementById('feedback').value.trim()
    };

    // Disable button
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    try {
        const response = await fetch(`${API_URL}/feedback`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (response.ok) {
            // Show success message
            let message = 'We appreciate your feedback!';
            
            if (formData.rating >= 4) {
                message = `Thank you! Check your email for a special discount code: SAVE10`;
            } else if (formData.rating <= 2) {
                message = 'We\'re sorry for your experience. Our team will contact you shortly.';
            }

            successText.textContent = message;
            feedbackForm.style.display = 'none';
            successMessage.style.display = 'flex';

            // Reset form after 5 seconds
            setTimeout(() => {
                feedbackForm.reset();
                selectedRating = 0;
                updateStars();
                updateRatingText();
                feedbackForm.style.display = 'block';
                successMessage.style.display = 'none';
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit Feedback';
            }, 5000);
        } else {
            throw new Error(data.error || 'Failed to submit feedback');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to submit feedback. Please try again.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Feedback';
    }
});

// Initialize on page load
initStarRating();

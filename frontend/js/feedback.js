/* ===============================
   API CONFIG (PERMANENT FIX)
   Frontend (5500) → Backend (3000)
================================ */
const API_URL = 'http://localhost:3000/api';

/* ===============================
   DOM ELEMENTS
================================ */
const feedbackForm = document.getElementById('feedbackForm');
const starRating = document.getElementById('starRating');
const ratingInput = document.getElementById('rating');
const ratingText = document.getElementById('ratingText');
const successMessage = document.getElementById('successMessage');
const successText = document.getElementById('successText');
const submitBtn = document.getElementById('submitBtn');

/* ===============================
   STATE
================================ */
let selectedRating = 0;

/* ===============================
   STAR RATING LOGIC
================================ */
function initStarRating() {
    const stars = document.querySelectorAll('.star');

    stars.forEach(star => {
        star.addEventListener('click', () => {
            selectedRating = Number(star.dataset.rating);
            ratingInput.value = selectedRating;
            updateStars();
            updateRatingText();
        });

        star.addEventListener('mouseenter', () => {
            highlightStars(Number(star.dataset.rating));
        });
    });

    starRating.addEventListener('mouseleave', updateStars);
}

function highlightStars(rating) {
    document.querySelectorAll('.star').forEach((star, i) => {
        star.classList.toggle('active', i < rating);
    });
}

function updateStars() {
    highlightStars(selectedRating);
}

function updateRatingText() {
    const labels = {
        1: 'Poor',
        2: 'Fair',
        3: 'Good',
        4: 'Very Good',
        5: 'Excellent'
    };
    ratingText.textContent =
        selectedRating > 0 ? labels[selectedRating] : 'Select a rating';
}

/* ===============================
   FORM SUBMISSION (BULLETPROOF)
================================ */
feedbackForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (selectedRating === 0) {
        alert('Please select a rating');
        return;
    }

    const packageDamagedEl =
        document.querySelector('input[name="packageDamaged"]:checked');
    const onTimeEl =
        document.querySelector('input[name="onTime"]:checked');

    if (!packageDamagedEl || !onTimeEl) {
        alert('Please answer all questions');
        return;
    }

    const formData = {
        email: document.getElementById('email').value.trim(),
        rating: selectedRating,
        packageDamaged: packageDamagedEl.value,
        onTime: onTimeEl.value,
        feedback: document.getElementById('feedback').value.trim()
    };

    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    try {
        const response = await fetch(`${API_URL}/feedback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Server error');
        }

        let message = 'We appreciate your feedback!';
        if (formData.rating >= 4) {
            message = 'Thank you! Check your email for a discount code: SAVE10';
        } else if (formData.rating <= 2) {
            message = 'We’re sorry for your experience. Our team will contact you.';
        }

        successText.textContent = message;
        feedbackForm.style.display = 'none';
        successMessage.style.display = 'flex';
        successMessage.scrollIntoView({ behavior: 'smooth' });

        setTimeout(() => {
            feedbackForm.reset();
            selectedRating = 0;
            updateStars();
            updateRatingText();
            feedbackForm.style.display = 'block';
            successMessage.style.display = 'none';
        }, 5000);

    } catch (err) {
        console.error('Submit error:', err);
        alert('Failed to submit feedback. Please try again.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Feedback';
    }
});

/* ===============================
   INIT
================================ */
initStarRating();

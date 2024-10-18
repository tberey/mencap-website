//Global Bariables
var isStickyMenuVisible = true;
const hideButton = document.querySelector('.hide-sticky-menu-button');



// Burger Menu Toggle.
function toggleMenu() {
    var menu = document.getElementById('menu');
    menu.scrollTop = 0;

    // Check if the menu is hidden
    if (menu.style.display === 'none' || menu.style.display === '') {
        menu.style.display = 'flex'; // Change to flex to show as full screen
    } else {
        menu.style.display = 'none'; // Hide the menu
    }

    var burgerMenuButton = document.getElementById('burgerMenuButton');
    burgerMenuButton.classList.toggle('active');

    var burgerIcon = document.querySelector('.burger-icon');
    burgerIcon.classList.toggle('active');

    document.body.classList.toggle('no-scroll');
    menu.classList.toggle('active');
}



// Hide sticky menu.
function hideStickyMenu() {
    isStickyMenuVisible = !isStickyMenuVisible
    stickyContent.classList.remove('sticky');
    hideButton.style.display = 'none';
}



// Info Sqaure Anchoring and Scrolling Settings.
const stickyContent = document.querySelector('.sticky-content');
var screenWidth = Math.min(window.innerWidth, document.documentElement.clientWidth);
const delayPixels = 250;
let stickyOffset;

if (screenWidth < 900) {
    if (isStickyMenuVisible) {
        stickyContent.classList.add('sticky');
        hideButton.style.display = 'block';
    } else {
        stickyContent.classList.remove('sticky');
        hideButton.style.display = 'none';
    }
}

function updateStickyOffset() {
    if (stickyContent) {
        stickyOffset = stickyContent.offsetTop;
    }
}

function handleScroll() {
    const triggerElement = document.getElementById('trigger-element');

    if (!triggerElement) return;

    const scrolledPastTrigger = (window.scrollY >= triggerElement.offsetTop + delayPixels);
    const isElementOffScreen = !isElementInViewport(triggerElement);

    if (isElementOffScreen && scrolledPastTrigger) {
        if (isStickyMenuVisible) {
            stickyContent.classList.add('sticky');
            hideButton.style.display = 'block';
        } else {
            stickyContent.classList.remove('sticky');
            hideButton.style.display = 'none';
        }
    } else {
        if (screenWidth > 900) {
            stickyContent.classList.remove('sticky');
            hideButton.style.display = 'none';
        }
    }
}

function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

function handleScrollUp() {
    if (window.pageYOffset < stickyOffset) {
        stickyContent.classList.remove('sticky');
    }
}

updateStickyOffset();

window.addEventListener('resize', () => {
    screenWidth = Math.min(window.innerWidth, document.documentElement.clientWidth);
    updateStickyOffset();
    handleScroll();
    handleScrollUp();

    if (screenWidth < 900) {
        stickyContent.classList.add('sticky');
        document.getElementById("menu").style.display = "none";
    } else {
        stickyContent.classList.remove('sticky');
        handleScroll();
        handleScrollUp();
        document.getElementById("menu").style.display = "flex";
    }
});
window.addEventListener('scroll', () => {
    handleScroll();
    handleScrollUp();
});



// Header Image Auto-Scroller.
const images = document.querySelectorAll('.image');
let currentIndex = 0;

function fadeImages() {
    images[currentIndex].classList.remove('active');
    currentIndex = (currentIndex + 1) % images.length;
    images[currentIndex].classList.add('active');
}
setInterval(fadeImages, 4500);



// Articles Confirm Delete prompt.
function confirmArticleDelete(id, uuid, thumbImg, mainImg, file) {
    var confirmation = confirm("Are you sure you want to delete your article?");
    if (confirmation) {
        var files = [];

        if (thumbImg.length > 1) files.push(thumbImg);
        if (mainImg.length > 1) files.push(mainImg);
        if (file.length > 1) files.push(file);

        fetch('/article-delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                articleId: id,
                userUid: uuid,
                files: files.length ? files : null,
            }),
        })
        .then(response => response.json())
        .then(data => {
            alert(data.log);
            window.location.href = data.redirect;
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }
}

// Articles clear download input fields.
function setupFileUpload() {
    var clearButtons = document.querySelectorAll('.clear-button');

    clearButtons.forEach(function(clearButton) {
      clearButton.style.display = 'none';
      clearButton.addEventListener('click', clearFileInput);
    });

    var fileInputs = document.querySelectorAll('input[type="file"]');

    fileInputs.forEach(function(fileInput) {
      fileInput.addEventListener('change', handleFileChange);
    });
  }

  function handleFileChange() {
    var inputId = this.id;
    var clearButton = document.querySelector('.clear-button[data-input-id="' + inputId + '"]');

    if (clearButton) {
      if (this.files.length > 0) {
        clearButton.style.display = 'inline-flex';
      } else {
        clearButton.style.display = 'none';
      }
    }
  }

  function clearFileInput() {
    var inputId = this.getAttribute('data-input-id');
    var fileInput = document.getElementById(inputId);
    var clearButton = document.querySelector('.clear-button[data-input-id="' + inputId + '"]');

    if (fileInput && clearButton) {
      fileInput.value = ''; // Clear the file input
      clearButton.style.display = 'none'; // Hide the clear button
    }
  }

  // Call the setup function when the document is ready
  document.addEventListener('DOMContentLoaded', setupFileUpload);



// Calendar Page Form and Fields Formatting.
function toggleTimeFields() {
    const allDayCheckbox = document.getElementById("alldaytrue");
    const timeFields = document.getElementById("timeFields");
    const startTimePicker = document.getElementById("startTimePicker");
    const endTimePicker = document.getElementById("endTimePicker");

    if (allDayCheckbox.checked) {
        timeFields.style.display = "none";
        startTimePicker.value = "";
        endTimePicker.value = "";
    } else {
        timeFields.style.display = "block";
        startTimePicker.value = "";
        endTimePicker.value = "";
    }
}

function toggleForm() {
    const dropdown = document.getElementById("formSelector");
    const recurringEvent = document.getElementById("recurringEvent");
    const eventForm = document.getElementById("eventForm");
    const daysOfWeekDiv = document.getElementById("daysOfWeek");
    const checkboxes = daysOfWeekDiv.querySelectorAll("input[type='checkbox']");

    if (dropdown.value === "recurringEvent") {
        eventForm.style.display = "block";
        recurringEvent.style.display = "block";
        checkboxes.forEach((checkbox) => {
            checkbox.checked = false;
        });
    } else if (dropdown.value === "singleEvent") {
        eventForm.style.display = "block";
        recurringEvent.style.display = "none";
        checkboxes.forEach((checkbox) => {
            checkbox.checked = false;
        });
    } else {
        recurringEvent.style.display = "none";
        eventForm.style.display = "none";
        checkboxes.forEach((checkbox) => {
            checkbox.checked = false;
        });
    }
}

// Function to confirm deleting an event(s).
function confirmEventDelete(id, uuid) {
    var confirmation = confirm("Are you sure you want to delete your event?");
    if (confirmation) {
        fetch('/event-delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                eventId: id,
                userUid: uuid
            }),
        })
        .then(response => response.json())
        .then(data => {
            alert(data.log);
            window.location.href = data.redirect;
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }
}



// Function to initialize the Gallery page.
function initializePage() {
    var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    // Get the drop-down element
    var monthDropdown = document.getElementById("month");

    // Check if the element exists before performing operations
    if (monthDropdown) {
        // Get the current month (0-indexed)
        var currentMonth = new Date().getMonth();

        // Populate the drop-down with the next 12 months
        for (var i = 0; i < 12; i++) {
        var option = document.createElement("option");
        option.text = monthNames[(currentMonth + i) % 12];
        option.value = (currentMonth + i) % 12 + 1; // Adding 1 to make months 1-indexed
        monthDropdown.add(option);
        }
    }

    // Get the drop-down element
    var yearDropdown = document.getElementById("year");

    // Check if the element exists before performing operations
    if (yearDropdown) {
        // Get the current year
        var currentYear = new Date().getFullYear();

        // Populate the drop-down with the last 5 years
        for (var i = 0; i < 5; i++) {
        var option = document.createElement("option");
        option.text = currentYear - i;
        option.value = currentYear - i;
        yearDropdown.add(option);
        }
    }

    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const selectedYear = urlParams.get('yearView');

    const yearViewDropdown = document.getElementById('yearView');

    if (selectedYear && yearViewDropdown) {
        // Set the default value if there's a query parameter
        yearViewDropdown.value = selectedYear;
    }

    // Add event listener for future changes
    if (yearViewDropdown) {
        yearViewDropdown.addEventListener('change', function () {
            const selectedYear = this.value;
            updateGallery(selectedYear);
        });
    }
}

// Function to update the gallery
function updateGallery(selectedYear) {
    window.location.href = `/gallery?yearView=${encodeURIComponent(selectedYear)}`;
}

// Call the initialization function when the DOM is loaded
document.addEventListener('DOMContentLoaded', initializePage);



// Full Size Image Viewer
function showImage(src) {
    // Set the source of the full-sized image
    document.getElementById('fullSizeImage').src = src;
    document.getElementById('footer').style.zIndex = '-1';
    document.getElementById('sticky-content').style.zIndex = '0';

    // Display the modal
    document.getElementById('imageModal').style.display = 'block';

    // Add click event listener to the overlay/background
    document.getElementById('imageModal').addEventListener('click', closeModalOnOverlay);
}

function closeModal() {
    // Hide the modal
    document.getElementById('imageModal').style.display = 'none';

    // Remove the click event listener for the overlay/background
    document.getElementById('imageModal').removeEventListener('click', closeModalOnOverlay);
    document.getElementById('footer').style.zIndex = '1';
    document.getElementById('sticky-content').style.zIndex = '200';
}

// Function to close the modal when clicking on the overlay/background
function closeModalOnOverlay(event) {
    if (event.target === document.getElementById('imageModal')) {
        closeModal();
    }
}


// Function to confirm deleting a gallery item(s).
function confirmGalleryDelete(id, uuid, media) {
    var confirmation = confirm("Are you sure you want to delete your media?");
    if (confirmation) {
        fetch('/gallery-delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                galleryId: id,
                userUid: uuid,
                files: [media],
            }),
        })
        .then(response => response.json())
        .then(data => {
            alert(data.log);
            window.location.href = data.redirect;
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }
}



// Function to set form load time when DOM is loaded
function setFormLoadTime() {
    var formLoadTime = document.getElementById('formLoadTime');

    if (formLoadTime) {
        formLoadTime.value = new Date().getTime();
    }
}

// Function to calculate time difference on form submission
function calculateTimeDifference() {
    var formLoadTime = document.getElementById('formLoadTime');

    if (formLoadTime) {
        formLoadTime = formLoadTime.value;
        const formSubmitTime = new Date().getTime();
        const timeDifference = formSubmitTime - formLoadTime;
        document.getElementById('formSubmitTime').value = timeDifference;
    }
}

// Event listener for DOMContentLoaded to set form load time
document.addEventListener('DOMContentLoaded', function() {
    setFormLoadTime();
});

// Event listener for form submission to calculate time difference
timingContactForm = document.getElementById('contactForm')
if (timingContactForm) {
    timingContactForm.addEventListener('submit', function(event) {
        calculateTimeDifference();
    });
}

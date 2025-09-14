//this file is the pop-up overlay component, similar to the login popup, but reusable for the dashboard side of things
import React, { useState } from 'react';
import "../../../styles/components/modal/modal.scss";

const Modal = ({ isOpen, onClose, content }) => {
    if (!isOpen) return null;
  
    return (
      <div className="modal" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <button className="close-btn" onClick={onClose}>
            x
          </button>
          
          <div className='modal-inner-content'>
            {content}
          </div>
        </div>
      </div>
    );
  };
export default Modal
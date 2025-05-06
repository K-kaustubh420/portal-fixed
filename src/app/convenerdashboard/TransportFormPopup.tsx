// File: src/app/convenerdashboard/TransportFormPopup.tsx
// Or components/TransportFormPopup.tsx (adjust path as needed)

import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import axios from 'axios';
import { jsPDF } from "jspdf";

// --- Interfaces ---
interface TransportApiData { convener_name?: string; convener_designation?: string; convener_department?: { id: number; name: string; }; convener_email?: string; event_date?: string; number_of_guests?: number; chief_guests?: Array<{ name?: string; designation?: string; address?: string; phone?: string; }>; }
// Remove refNo from here if it's always generated
interface TransportFormData { facultyOf: 'E&T' | 'Placement' | 'DRVE' | 'Management' | 'IHM' | 'Admission' | 'Others' | ''; requesterName: string; requesterDesignation: string; requesterDepartment: string; requesterEmpId: string; requesterMobile: string; requesterEmail: string; eventDate: string; purpose: string; researchScholarNameDept: string; researchScholarRegNo: string; researchScholarMobile: string; numberOfGuests: string; guestType: string; modeOfTransport: 'UNIV. VEHICLE' | 'OWN CAR' | ''; guestDetailsText: string; pickupDate: string; pickupTime: string; pickupFrom: string; pickupTo: string; dropDate: string; dropTime: string; dropFrom: string; dropTo: string; formDate: string; }
interface TransportFormPopupProps { proposalId: string; isOpen: boolean; onClose: () => void; token: string; apiBaseUrl: string; }

// --- Default Form Data Function (Removed refNo) ---
const getDefaultFormData = (): TransportFormData => ({ facultyOf: 'E&T', requesterName: '', requesterDesignation: '', requesterDepartment: '', requesterEmpId: '', requesterMobile: '', requesterEmail: '', eventDate: '', purpose: 'Industrial visit', researchScholarNameDept: '', researchScholarRegNo: '', researchScholarMobile: '', numberOfGuests: '', guestType: 'Students & Staffs', modeOfTransport: 'UNIV. VEHICLE', guestDetailsText: '', pickupDate: '', pickupTime: '11:00', pickupFrom: 'SRMIST Kattankulathur', pickupTo: '', dropDate: '', dropTime: '16:00', dropFrom: '', dropTo: 'SRMIST Kattankulathur', formDate: new Date().toLocaleDateString('en-CA'), });

// --- Component ---
const TransportFormPopup: React.FC<TransportFormPopupProps> = ({ proposalId, isOpen, onClose, token, apiBaseUrl }) => {
    const [formData, setFormData] = useState<TransportFormData>(getDefaultFormData());
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLogoLoaded, setIsLogoLoaded] = useState(false);
    const [logoDataUri, setLogoDataUri] = useState<string | null>(null);
    const [logoError, setLogoError] = useState<string | null>(null); // State for logo loading errors


    // --- useEffect for data fetching (Keep as is) ---
    useEffect(() => {
        if (!isOpen || !proposalId || !token) { setError(null); return; }
        const fetchTransportData = async () => { setIsLoading(true); setError(null); const url = `${apiBaseUrl}/api/faculty/transport/${proposalId}`; try { const response = await axios.get<{ transport_details: TransportApiData }>(url, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }, }); const details = response.data.transport_details; if (!details) throw new Error("Transport details not found in API response."); const apiEventDate = details.event_date ? details.event_date.split(' ')[0] : ''; setFormData({ ...getDefaultFormData(), requesterName: details.convener_name || '', requesterDesignation: details.convener_designation || '', requesterDepartment: details.convener_department?.name || '', requesterEmail: details.convener_email || '', eventDate: apiEventDate, pickupDate: apiEventDate, dropDate: apiEventDate, numberOfGuests: details.number_of_guests?.toString() || '', guestDetailsText: details.chief_guests?.map(g => `Name: ${g.name || 'N/A'}\nDesignation: ${g.designation || 'N/A'}\nAddress: ${g.address || 'N/A'}\nPhone: ${g.phone || 'N/A'}`).join('\n\n') || '', }); } catch (err) { console.error("Error fetching transport details:", err); setError(axios.isAxiosError(err) ? `Failed to fetch details: ${(err.response?.data as any)?.message || err.message}` : 'An unknown error occurred.'); } finally { setIsLoading(false); } };
        fetchTransportData();
    }, [isOpen, proposalId, token, apiBaseUrl]);

    // --- useEffect for loading logo ---
    useEffect(() => {
        if (isOpen) {
            console.log("Popup opened, attempting to load logo...");
            setLogoError(null); // Reset error on open
            setIsLogoLoaded(false); // Reset loaded state
            setLogoDataUri(null);

            const img = new Image();
            img.crossOrigin = "Anonymous"; // May help if loading from different origin/CDN later
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.naturalWidth; // Use naturalWidth for original size
                    canvas.height = img.naturalHeight;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        throw new Error("Could not get canvas context");
                    }
                    ctx.drawImage(img, 0, 0);
                    const dataUri = canvas.toDataURL('image/jpeg'); // Or 'image/png' if it's PNG
                    if (dataUri && dataUri !== 'data:,') { // Basic check for valid data URI
                         setLogoDataUri(dataUri);
                         setIsLogoLoaded(true);
                         console.log("SRM Logo loaded and converted successfully.");
                    } else {
                        throw new Error("Canvas toDataURL returned empty or invalid data.");
                    }
                } catch (canvasError: any) {
                    console.error("Error converting logo image to data URI:", canvasError);
                    setLogoError(`Failed to process logo: ${canvasError.message}`);
                    setIsLogoLoaded(false);
                }
            };
            img.onerror = (errEvt) => {
                const errMsg = typeof errEvt === 'string' ? errEvt : `Failed to load image resource from ${img.src}`;
                console.error("Error loading SRM Logo image:", errMsg);
                setLogoError(errMsg); // Store error message
                setIsLogoLoaded(false);
            };
            // Ensure the path starts with '/' for the public directory
            img.src = '/SRMlogo.jpg'; // Double-check filename and extension
            console.log("Setting image src to:", img.src);
        } else {
            setIsLogoLoaded(false);
            setLogoDataUri(null);
            setLogoError(null);
        }
    }, [isOpen]);

    // --- handleChange (Keep as is) ---
    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value, })); };

    // --- PDF Generation Logic - FINAL CHECK ---
    const handleDownloadPdf = () => {
        // Validation (Remove refNo if it was removed from interface)
        const requiredFields: (keyof TransportFormData)[] = ['facultyOf', 'requesterEmpId', 'requesterMobile', 'eventDate', 'purpose', 'numberOfGuests', 'guestType', 'modeOfTransport', 'pickupDate', 'pickupTime', 'pickupFrom', 'pickupTo', 'dropDate', 'dropTime', 'dropFrom', 'dropTo'];
        const missingFields = requiredFields.filter(field => !formData[field]?.trim());
        if (missingFields.length > 0) { const fieldNamesMap: Record<string, string> = { facultyOf: "Faculty/Office", requesterEmpId: "Employee ID", requesterMobile: "Mobile No", eventDate: "Event Date", purpose: "Purpose", numberOfGuests: "No. of Guests", guestType: "Guest Type", modeOfTransport: "Mode of Transport", pickupDate: "Pickup Date", pickupTime: "Pickup Time", pickupFrom: "Pickup From", pickupTo: "Pickup To", dropDate: "Drop Date", dropTime: "Drop Time", dropFrom: "Drop From", dropTo: "Drop To" }; const missingFieldNames = missingFields.map(f => fieldNamesMap[f] || f).join(', '); alert(`Please fill in all required fields: ${missingFieldNames}`); return; }
        if (!isLogoLoaded || !logoDataUri) {
            alert(`Logo could not be loaded. ${logoError ? `Error: ${logoError}` : 'Please ensure SRMlogo.jpg is in the public folder and try again.'}`);
            return;
        }

        const doc = new jsPDF('p', 'pt', 'a4');
        const pageHeight = doc.internal.pageSize.getHeight(); const pageWidth = doc.internal.pageSize.getWidth(); const margin = 40; const contentWidth = pageWidth - 2 * margin;
        let y = margin;
        const fieldPadding = 6; const valueIndent = 150; const lineHeight = 15; const sectionSpacing = 10; const itemSpacingFactor = 0.3;

        // Helper Functions (Keep as is)
        const formatDisplayDate = (dateStr: string): string => { if (!dateStr) return '-'; try { const [year, month, day] = dateStr.split('-'); return `${day}/${month}/${year}`; } catch { return dateStr; } };
        const formatDisplayTime = (timeStr: string): string => { if (!timeStr) return '-'; try { const [hours, minutes] = timeStr.split(':').map(Number); const ampm = hours >= 12 ? 'PM' : 'AM'; const formattedHours = hours % 12 || 12; return `${formattedHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`; } catch { return timeStr; } };
        const drawBoxWithContent = (content: { label: string, value?: string | null }[], startX: number, startY: number, boxWidth: number, options: { hasTopBorder?: boolean, hasBottomBorder?: boolean, minHeight?: number } = {}): number => { const { hasTopBorder = true, hasBottomBorder = true, minHeight = 0 } = options; let currentY = startY + fieldPadding + (lineHeight * 0.5); let boxContentHeight = 0; doc.setFontSize(9); content.forEach((item, index) => { doc.setFont('helvetica', 'bold'); doc.text(item.label, startX + fieldPadding, currentY, { maxWidth: valueIndent - (fieldPadding * 1.5) }); doc.setFont('helvetica', 'normal'); const valueText = item.value?.trim() || '-'; const valueMaxWidth = boxWidth - valueIndent - (fieldPadding * 1.5); const textLines = doc.splitTextToSize(valueText, valueMaxWidth); doc.text(textLines, startX + valueIndent, currentY); const itemHeight = Math.max(lineHeight, textLines.length * lineHeight); currentY += itemHeight + (lineHeight * itemSpacingFactor); if (index < content.length - 1) { currentY += lineHeight * 0.2; } }); boxContentHeight = currentY - (startY + fieldPadding + (lineHeight * 0.5)); const finalBoxHeight = Math.max(boxContentHeight + fieldPadding * 2 + (lineHeight * 0.5), minHeight) ; doc.setDrawColor(150); doc.setLineWidth(0.5); if (hasTopBorder) doc.line(startX, startY, startX + boxWidth, startY); if (hasBottomBorder) doc.line(startX, startY + finalBoxHeight, startX + boxWidth, startY + finalBoxHeight); doc.line(startX, startY, startX, startY + finalBoxHeight); doc.line(startX + boxWidth, startY, startX + boxWidth, startY + finalBoxHeight); return startY + finalBoxHeight; };

        // --- PDF Content Drawing ---

        // 1. Add Logo (Ensure data URI is valid)
        const logoWidth = 50; const logoHeight = 50; const logoY = margin;
        try {
             doc.addImage(logoDataUri, 'JPEG', margin, logoY, logoWidth, logoHeight); // Assuming JPEG, change if PNG
             console.log("Logo added to PDF.");
        } catch (e) {
             console.error("Error adding logo image to PDF:", e);
             alert("Error adding logo to PDF. Please check console.");
             // Optionally continue without logo or stop generation
             // return;
        }


        // 2. Add Header Text (Positioned next to logo)
        const headerX = margin + logoWidth + 15;
        let headerTextY = logoY + 10; // Start Y for header text
        doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.text("SRM INSTITUTE OF SCIENCE AND TECHNOLOGY", headerX, headerTextY); headerTextY += 18;
        doc.setFontSize(12); doc.setFont('helvetica', 'normal'); doc.text("Kattankulathur - 603203", headerX, headerTextY); headerTextY += 20;
        doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.text("VEHICLE REQUISITION FORM", headerX, headerTextY);

        // 3. Add Form Req No and Date (Aligned Right)
        const now = new Date(); const currentMonth = now.getMonth(); const currentFullYear = now.getFullYear();
        let financialYearStart: number; let financialYearEndShort: string;
        if (currentMonth >= 3) { financialYearStart = currentFullYear; financialYearEndShort = (currentFullYear + 1).toString().slice(-2); } else { financialYearStart = currentFullYear - 1; financialYearEndShort = currentFullYear.toString().slice(-2); }
        const financialYearString = `${financialYearStart}-${financialYearEndShort}`;
        const formattedReqId = proposalId.toString().padStart(4, '0'); // Padded proposal ID as placeholder
        const formReqNo = `ISSTR/${financialYearString}/${formattedReqId}`;

        doc.setFontSize(9); doc.setFont('helvetica', 'normal');
        const rightAlignX = pageWidth - margin;
        const formReqNoY = margin + 22; // Adjusted Y slightly
        const dateFilledY = formReqNoY + 15;
        doc.text(`Form Req. No: ${formReqNo}`, rightAlignX, formReqNoY, { align: 'right' });
        doc.text(`Date Filled: ${formatDisplayDate(formData.formDate)}`, rightAlignX, dateFilledY, { align: 'right' });

        // 4. Determine starting Y for content boxes (BELOW ALL header elements)
        y = Math.max(logoY + logoHeight, headerTextY, dateFilledY) + sectionSpacing * 1.5; // Use tallest element + spacing

        // 5. Draw Main Content Boxes (Keep structure)
        y = drawBoxWithContent([{ label: '1. Faculty of:', value: formData.facultyOf }, { label: '2. Name of Staff/Guide:', value: formData.requesterName }, { label: '3. Designation & Dept:', value: `${formData.requesterDesignation || '-'}, ${formData.requesterDepartment || '-'}` }, { label: '4. Employee ID:', value: formData.requesterEmpId }, { label: '5. Contact Details:', value: `Mobile: ${formData.requesterMobile || '-'}\nEmail: ${formData.requesterEmail || '-'}` },], margin, y, contentWidth); y += sectionSpacing;
        y = drawBoxWithContent([{ label: '6. Event Date:', value: formatDisplayDate(formData.eventDate) }, { label: '7. Purpose:', value: formData.purpose },], margin, y, contentWidth); y += sectionSpacing;
        const hasResearchScholar = formData.researchScholarNameDept?.trim() || formData.researchScholarRegNo?.trim() || formData.researchScholarMobile?.trim(); if (hasResearchScholar) { y = drawBoxWithContent([{ label: '8. Research Scholar:', value: `Name & Dept: ${formData.researchScholarNameDept || '-'}\nReg. No: ${formData.researchScholarRegNo || '-'}\nMobile: ${formData.researchScholarMobile || '-'}` },], margin, y, contentWidth); y += sectionSpacing; }
        y = drawBoxWithContent([{ label: '9. No. of Guests:', value: `${formData.numberOfGuests} (${formData.guestType || '-'})` }, { label: '10. Mode of Transport:', value: formData.modeOfTransport },], margin, y, contentWidth); y += sectionSpacing;
        y = drawBoxWithContent([{ label: '11. Guest Details:', value: formData.guestDetailsText || '-' },], margin, y, contentWidth, { minHeight: 60 }); y += sectionSpacing;

        // Section 12 (Keep as is)
        const colWidth = contentWidth / 2 - (sectionSpacing / 2); const pickupDropStartY = y; let pickupBoxEndY = pickupDropStartY; let dropBoxEndY = pickupDropStartY;
        pickupBoxEndY = drawBoxWithContent([{ label: '12. Pickup Details', value: '' },{ label: 'Date:', value: formatDisplayDate(formData.pickupDate) },{ label: 'Time:', value: formatDisplayTime(formData.pickupTime) },{ label: 'From:', value: formData.pickupFrom },{ label: 'To:', value: formData.pickupTo },], margin, pickupDropStartY, colWidth);
        dropBoxEndY = drawBoxWithContent([{ label: '12. Drop Details', value: '' },{ label: 'Date:', value: formatDisplayDate(formData.dropDate) },{ label: 'Time:', value: formatDisplayTime(formData.dropTime) },{ label: 'From:', value: formData.dropFrom },{ label: 'To:', value: formData.dropTo },], margin + colWidth + sectionSpacing, pickupDropStartY, colWidth);
        y = Math.max(pickupBoxEndY, dropBoxEndY) + sectionSpacing;

        // Signatures Area (Keep as is)
        const signatureY = pageHeight - margin - 40; doc.setDrawColor(0); doc.setLineWidth(0.7); doc.line(margin, signatureY, pageWidth - margin, signatureY); y = signatureY + 15; doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.text("Signature of Staff", margin, y); doc.text("Approved By", pageWidth / 2, y, { align: 'center' }); doc.text("Director", pageWidth - margin, y, { align: 'right' });

        // Footer (Keep as is)
        const footerY = pageHeight - margin + 5; doc.setFontSize(8); doc.setFont('helvetica', 'italic'); doc.setTextColor(100); doc.text("This is an Electronically Generated pdf doesn't Requires Signature", pageWidth / 2, footerY, { align: 'center' });

        // Save PDF (Keep as is)
        doc.save(`SRM_Vehicle_Requisition_${formData.requesterName.replace(/\s+/g, '_') || 'Form'}_${formData.eventDate}.pdf`);
    };

    // --- Component Render (Keep as is) ---
    const inputBaseClasses = "input input-bordered input-sm w-full text-gray-900 bg-white border border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary placeholder-gray-400";
    const selectBaseClasses = "select select-bordered select-sm w-full text-gray-900 bg-white border border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary font-normal";
    const textareaBaseClasses = "textarea textarea-bordered textarea-sm w-full text-gray-900 bg-white border border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary placeholder-gray-400";
    const readOnlyClasses = "bg-gray-100 text-gray-700 cursor-not-allowed border-gray-200";
    const labelTextClasses = "label-text text-xs text-gray-600";

    if (!isOpen) return null;

    return (
        <div className={`modal ${isOpen ? 'modal-open' : ''}`}>
            <div className="modal-box w-11/12 max-w-4xl relative bg-white text-gray-800">
                 {/* JSX remains the same: button, h3, loading, error, form, fieldsets... */}
                 <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 z-10 text-gray-600 hover:text-gray-900" aria-label="Close">✕</button>
                 <h3 className="font-bold text-xl mb-6 text-center text-gray-900">Vehicle Requisition Form</h3>
                 {isLoading && ( <div className="flex justify-center items-center p-10"><span className="loading loading-dots loading-lg text-primary"></span></div> )}
                 {error && !isLoading && ( <div className="alert alert-error shadow-lg mb-4 text-white"><div><svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg><span>Error: {error ? error : logoError}</span></div></div> )} {/* Show logo error too */}
                 {!isLoading && (
                      <form onSubmit={(e: FormEvent) => e.preventDefault()} className="space-y-4 text-gray-800">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                              <fieldset className="border border-gray-300 p-4 rounded-md space-y-3 col-span-1 md:col-span-2 bg-white"> <legend className="font-semibold px-2 -ml-2 text-gray-700">1-5. Requester Information</legend> <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"> <div className="form-control"><label className="label py-1"><span className={labelTextClasses}>2. Name</span></label><input type="text" value={formData.requesterName} className={`${inputBaseClasses} ${readOnlyClasses}`} readOnly disabled /></div> <div className="form-control"><label className="label py-1"><span className={labelTextClasses}>3. Designation</span></label><input type="text" value={formData.requesterDesignation} className={`${inputBaseClasses} ${readOnlyClasses}`} readOnly disabled /></div> <div className="form-control"><label className="label py-1"><span className={labelTextClasses}>3. Department</span></label><input type="text" value={formData.requesterDepartment} className={`${inputBaseClasses} ${readOnlyClasses}`} readOnly disabled /></div> <div className="form-control"><label className="label py-1"><span className={labelTextClasses}>5. Email ID</span></label><input type="email" value={formData.requesterEmail} className={`${inputBaseClasses} ${readOnlyClasses}`} readOnly disabled /></div> <div className="form-control"><label htmlFor="requesterEmpId" className="label py-1"><span className={labelTextClasses}>4. Employee ID <span className="text-red-500">*</span></span></label><input type="text" id="requesterEmpId" name="requesterEmpId" value={formData.requesterEmpId} onChange={handleChange} placeholder="Enter Employee ID" className={inputBaseClasses} required /></div> <div className="form-control"><label htmlFor="requesterMobile" className="label py-1"><span className={labelTextClasses}>5. Mobile No <span className="text-red-500">*</span></span></label><input type="tel" id="requesterMobile" name="requesterMobile" value={formData.requesterMobile} onChange={handleChange} placeholder="Enter 10-digit Mobile" className={inputBaseClasses} required pattern="[0-9]{10}" title="Enter a 10-digit mobile number"/></div> <div className="form-control sm:col-span-2"><label htmlFor="facultyOf" className="label py-1"><span className={labelTextClasses}>1. Faculty/Office <span className="text-red-500">*</span></span></label><select id="facultyOf" name="facultyOf" value={formData.facultyOf} onChange={handleChange} className={selectBaseClasses} required><option value="" disabled>Select...</option><option value="E&T">E&T</option><option value="Placement">Placement</option><option value="DRVE">DRVE</option><option value="Management">Management</option><option value="IHM">IHM</option><option value="Admission">Admission</option><option value="Others">Others</option></select></div> </div> </fieldset>
                               <fieldset className="border border-gray-300 p-4 rounded-md space-y-3 col-span-1 md:col-span-2 bg-white"> <legend className="font-semibold px-2 -ml-2 text-gray-700">6-11. Event & Guest Information</legend> <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"> <div className="form-control"><label htmlFor="eventDate" className="label py-1"><span className={labelTextClasses}>6. Event Date <span className="text-red-500">*</span></span></label><input type="date" id="eventDate" name="eventDate" value={formData.eventDate} onChange={handleChange} className={inputBaseClasses} required /></div> <div className="form-control"><label htmlFor="purpose" className="label py-1"><span className={labelTextClasses}>7. Purpose <span className="text-red-500">*</span></span></label><input type="text" id="purpose" name="purpose" value={formData.purpose} onChange={handleChange} placeholder="e.g., Industrial Visit" className={inputBaseClasses} required /></div> <div className="form-control"><label htmlFor="numberOfGuests" className="label py-1"><span className={labelTextClasses}>9. No. of Guests <span className="text-red-500">*</span></span></label><input type="number" id="numberOfGuests" name="numberOfGuests" value={formData.numberOfGuests} onChange={handleChange} placeholder="e.g., 28" className={inputBaseClasses} required min="1"/></div> <div className="form-control"><label htmlFor="guestType" className="label py-1"><span className={labelTextClasses}>9. Guest Type <span className="text-red-500">*</span></span></label><input type="text" id="guestType" name="guestType" value={formData.guestType} onChange={handleChange} placeholder="e.g., Students & Staffs" className={inputBaseClasses} required /></div> <div className="form-control sm:col-span-2"><label htmlFor="modeOfTransport" className="label py-1"><span className={labelTextClasses}>10. Mode of Transport <span className="text-red-500">*</span></span></label><select id="modeOfTransport" name="modeOfTransport" value={formData.modeOfTransport} onChange={handleChange} className={selectBaseClasses} required><option value="" disabled>Select...</option><option value="UNIV. VEHICLE">University Vehicle</option><option value="OWN CAR">Own Car</option></select></div> <div className="form-control sm:col-span-2"><label htmlFor="guestDetailsText" className="label py-1"><span className={labelTextClasses}>11. Guest Details (if applicable)</span></label><textarea id="guestDetailsText" name="guestDetailsText" value={formData.guestDetailsText} onChange={handleChange} className={textareaBaseClasses} rows={4} placeholder="Enter guest details..."></textarea></div> </div> </fieldset>
                               <fieldset className="border border-gray-300 p-4 rounded-md space-y-3 bg-white"> <legend className="font-semibold px-2 -ml-2 text-gray-700">12. Pickup Details</legend> <div className="form-control"><label htmlFor="pickupDate" className="label py-1"><span className={labelTextClasses}>Date <span className="text-red-500">*</span></span></label><input type="date" id="pickupDate" name="pickupDate" value={formData.pickupDate} onChange={handleChange} className={inputBaseClasses} required /></div> <div className="form-control"><label htmlFor="pickupTime" className="label py-1"><span className={labelTextClasses}>Time <span className="text-red-500">*</span></span></label><input type="time" id="pickupTime" name="pickupTime" value={formData.pickupTime} onChange={handleChange} className={inputBaseClasses} required /></div> <div className="form-control"><label htmlFor="pickupFrom" className="label py-1"><span className={labelTextClasses}>From <span className="text-red-500">*</span></span></label><input type="text" id="pickupFrom" name="pickupFrom" value={formData.pickupFrom} onChange={handleChange} placeholder="Pickup Location" className={inputBaseClasses} required/></div> <div className="form-control"><label htmlFor="pickupTo" className="label py-1"><span className={labelTextClasses}>To <span className="text-red-500">*</span></span></label><input type="text" id="pickupTo" name="pickupTo" value={formData.pickupTo} onChange={handleChange} placeholder="Destination" className={inputBaseClasses} required/></div> </fieldset>
                               <fieldset className="border border-gray-300 p-4 rounded-md space-y-3 bg-white"> <legend className="font-semibold px-2 -ml-2 text-gray-700">12. Drop Details</legend> <div className="form-control"><label htmlFor="dropDate" className="label py-1"><span className={labelTextClasses}>Date <span className="text-red-500">*</span></span></label><input type="date" id="dropDate" name="dropDate" value={formData.dropDate} onChange={handleChange} className={inputBaseClasses} required/></div> <div className="form-control"><label htmlFor="dropTime" className="label py-1"><span className={labelTextClasses}>Time <span className="text-red-500">*</span></span></label><input type="time" id="dropTime" name="dropTime" value={formData.dropTime} onChange={handleChange} className={inputBaseClasses} required/></div> <div className="form-control"><label htmlFor="dropFrom" className="label py-1"><span className={labelTextClasses}>From <span className="text-red-500">*</span></span></label><input type="text" id="dropFrom" name="dropFrom" value={formData.dropFrom} onChange={handleChange} placeholder="Drop Start Location" className={inputBaseClasses} required/></div> <div className="form-control"><label htmlFor="dropTo" className="label py-1"><span className={labelTextClasses}>To <span className="text-red-500">*</span></span></label><input type="text" id="dropTo" name="dropTo" value={formData.dropTo} onChange={handleChange} placeholder="Final Destination" className={inputBaseClasses} required/></div> </fieldset>
                               <fieldset className="border border-gray-300 p-4 rounded-md space-y-3 col-span-1 md:col-span-2 bg-white"> <legend className="font-semibold px-2 -ml-2 text-gray-700">8. Research Scholar (Optional)</legend> <div className="grid grid-cols-1 sm:grid-cols-3 gap-3"> <div className="form-control"><label htmlFor="researchScholarNameDept" className="label py-1"><span className={labelTextClasses}>Name & Department</span></label><input type="text" id="researchScholarNameDept" name="researchScholarNameDept" value={formData.researchScholarNameDept} onChange={handleChange} className={inputBaseClasses}/></div> <div className="form-control"><label htmlFor="researchScholarRegNo" className="label py-1"><span className={labelTextClasses}>Registration No.</span></label><input type="text" id="researchScholarRegNo" name="researchScholarRegNo" value={formData.researchScholarRegNo} onChange={handleChange} className={inputBaseClasses}/></div> <div className="form-control"><label htmlFor="researchScholarMobile" className="label py-1"><span className={labelTextClasses}>Mobile No.</span></label><input type="tel" id="researchScholarMobile" name="researchScholarMobile" value={formData.researchScholarMobile} onChange={handleChange} className={inputBaseClasses}/></div> </div> </fieldset>
                          </div>
                          <div className="modal-action mt-6 flex justify-end space-x-3"> <button type="button" onClick={onClose} className="btn btn-ghost text-gray-700 hover:bg-gray-200">Cancel</button> <button type="button" onClick={handleDownloadPdf} className="btn btn-secondary" disabled={isLoading || !isLogoLoaded}> {isLogoLoaded ? 'Download as PDF'  : 'Loading Logo...'} </button> </div>
                      </form>
                 )}
            </div>
            <label className="modal-backdrop" htmlFor="" title="Close" onClick={onClose}>Close</label>
        </div>
    );
};

export default TransportFormPopup;
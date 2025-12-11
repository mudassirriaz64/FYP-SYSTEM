import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateFormAPDF = (proposalData, groupData) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('FORM-A', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('(To be filled by student(s))', doc.internal.pageSize.getWidth() / 2, 28, { align: 'center' });
  
  // Group Information
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Group Information', 14, 45);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Group ID: ${groupData.groupId || 'N/A'}`, 14, 52);
  doc.text(`Project Title: ${groupData.projectTitle || 'N/A'}`, 14, 59);
  doc.text(`Department: ${groupData.departmentName || 'N/A'}`, 14, 66);
  
  // Parse form data if it's a JSON string
  let formData = proposalData.formData;
  if (typeof formData === 'string') {
    try {
      formData = JSON.parse(formData);
    } catch (e) {
      console.error('Failed to parse form data:', e);
      formData = {};
    }
  }
  
  // Group Members Table
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Group Members', 14, 80);
  
  const members = groupData.members || [];
  
  // Handle different formData structures
  let tableData = [];
  if (Array.isArray(formData) && formData.length > 0) {
    // If formData is an array of memberStatuses
    if (formData[0]?.studentName) {
      // formData is memberStatuses array
      tableData = formData.map((memberStatus) => [
        memberStatus.isGroupManager ? '✓' : '',
        memberStatus.studentName || '',
        memberStatus.enrollmentId || '',
        memberStatus.cellNumber || '',
        memberStatus.email || '',
        memberStatus.postalAddress || ''
      ]);
    } else {
      // formData is form submission data, match with members
      tableData = members.map((member, index) => {
        const memberData = formData[index] || {};
        return [
          member.isGroupManager ? '✓' : '',
          member.studentName || '',
          member.enrollmentId || '',
          memberData.cellNumber || '',
          member.email || '',
          memberData.postalAddress || ''
        ];
      });
    }
  } else {
    // Fallback: use members data only
    tableData = members.map((member) => [
      member.isGroupManager ? '✓' : '',
      member.studentName || '',
      member.enrollmentId || '',
      '',
      member.email || '',
      ''
    ]);
  }
  
  doc.autoTable({
    startY: 85,
    head: [['Manager', 'Full Name', 'Enrollment #', 'Cell #', 'Email', 'Postal Address']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontSize: 10 },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      1: { cellWidth: 35 },
      2: { cellWidth: 30 },
      3: { cellWidth: 25 },
      4: { cellWidth: 40 },
      5: { cellWidth: 45 }
    }
  });
  
  // Footer
  const finalY = doc.lastAutoTable.finalY + 15;
  doc.setFontSize(10);
  doc.text(`Submitted on: ${new Date(proposalData.submittedAt).toLocaleDateString()}`, 14, finalY);
  doc.text(`Status: ${proposalData.status}`, 14, finalY + 7);
  
  if (proposalData.reviewRemarks) {
    doc.text('Remarks:', 14, finalY + 14);
    doc.setFont('helvetica', 'italic');
    const remarksLines = doc.splitTextToSize(proposalData.reviewRemarks, 180);
    doc.text(remarksLines, 14, finalY + 21);
  }
  
  return doc;
};

export const generateFormBPDF = (proposalData, groupData) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('FORM-B', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('(Project Proposal)', doc.internal.pageSize.getWidth() / 2, 28, { align: 'center' });
  
  // Group Information
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Group Information', 14, 45);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Group ID: ${groupData.groupId || 'N/A'}`, 14, 52);
  doc.text(`Project Title: ${groupData.projectTitle || 'N/A'}`, 14, 59);
  
  // Parse form data
  let formData = proposalData.formData;
  if (typeof formData === 'string') {
    try {
      formData = JSON.parse(formData);
    } catch (e) {
      formData = {};
    }
  }
  
  let yPos = 72;
  
  // Project Type
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('7. Degree Project Type', 14, yPos);
  yPos += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Type: ${formData.degreeProjectType || 'N/A'}`, 20, yPos);
  yPos += 7;
  if (formData.thesisDomain) {
    doc.text(`Thesis Domain: ${formData.thesisDomain}`, 20, yPos);
    yPos += 7;
  }
  if (formData.projectDomain) {
    doc.text(`Project Domain: ${formData.projectDomain}`, 20, yPos);
    yPos += 7;
  }
  yPos += 5;
  
  // Project Source
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('8. Industrial/Self Defined', 14, yPos);
  yPos += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Source: ${formData.projectSource || 'N/A'}`, 20, yPos);
  yPos += 10;
  
  // Work Area
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('9. Work Area', 14, yPos);
  yPos += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const workAreaLines = doc.splitTextToSize(formData.workArea || 'N/A', 180);
  doc.text(workAreaLines, 20, yPos);
  yPos += (workAreaLines.length * 5) + 8;
  
  // Problem Statement
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('10. Problem Statement', 14, yPos);
  yPos += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const problemLines = doc.splitTextToSize(formData.problemStatement || 'N/A', 180);
  doc.text(problemLines, 20, yPos);
  yPos += (problemLines.length * 5) + 8;
  
  // Check if we need a new page
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }
  
  // Objectives
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('11. Objectives', 14, yPos);
  yPos += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const objectivesLines = doc.splitTextToSize(formData.objectives || 'N/A', 180);
  doc.text(objectivesLines, 20, yPos);
  yPos += (objectivesLines.length * 5) + 8;
  
  // Methodology
  if (yPos > 240) {
    doc.addPage();
    yPos = 20;
  }
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('12. Methodology', 14, yPos);
  yPos += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const methodologyLines = doc.splitTextToSize(formData.methodology || 'N/A', 180);
  doc.text(methodologyLines, 20, yPos);
  yPos += (methodologyLines.length * 5) + 8;
  
  // Supervisor
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Supervisor Information', 14, yPos);
  yPos += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Selected Supervisor: ${formData.supervisorName || 'Not selected'}`, 20, yPos);
  yPos += 10;
  
  // Footer
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Submitted on: ${new Date(proposalData.submittedAt).toLocaleDateString()}`, 14, yPos);
  yPos += 7;
  doc.text(`Status: ${proposalData.status}`, 14, yPos);
  
  if (proposalData.reviewRemarks) {
    yPos += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Coordinator Remarks:', 14, yPos);
    yPos += 7;
    doc.setFont('helvetica', 'italic');
    const remarksLines = doc.splitTextToSize(proposalData.reviewRemarks, 180);
    doc.text(remarksLines, 14, yPos);
  }
  
  return doc;
};


import { gaInsuranceService } from './gaInsuranceService';
import { jubileeInsuranceService } from './jubileeInsuranceService';

export interface CopaymentCalculation {
  totalAmount: number;
  insuranceCovered: number;
  patientCopayment: number;
  deductibleAmount?: number;
  copaymentPercentage: number;
  breakdown: {
    subtotal: number;
    deductible: number;
    copaymentAmount: number;
    insuranceAmount: number;
    patientOwes: number;
  };
  insuranceProvider: string;
}

export interface TreatmentItem {
  name: string;
  code?: string;
  cost: number;
  quantity: number;
  duration?: string;
}

export const copaymentService = {
  // Calculate copayment based on insurance provider
  calculateCopayment(
    treatments: TreatmentItem[],
    insuranceProvider: string,
    membershipDetails?: any
  ): CopaymentCalculation {
    const totalAmount = treatments.reduce((sum, treatment) => 
      sum + (treatment.cost * treatment.quantity), 0
    );

    let result: CopaymentCalculation;

    switch (insuranceProvider.toUpperCase()) {
      case 'GA':
        const gaCalculation = gaInsuranceService.calculateCopayment(totalAmount, 20);
        result = {
          totalAmount,
          insuranceCovered: gaCalculation.insuranceCovered,
          patientCopayment: gaCalculation.patientCopayment,
          copaymentPercentage: gaCalculation.copaymentPercentage,
          breakdown: {
            subtotal: totalAmount,
            deductible: 0,
            copaymentAmount: gaCalculation.patientCopayment,
            insuranceAmount: gaCalculation.insuranceCovered,
            patientOwes: gaCalculation.patientCopayment
          },
          insuranceProvider: 'GA'
        };
        break;

      case 'JUBILEE':
        const jubileeCalculation = jubileeInsuranceService.calculateCopayment(
          totalAmount, 
          membershipDetails?.copaymentPercentage || 10,
          membershipDetails?.deductible || 5000
        );
        result = {
          totalAmount,
          insuranceCovered: jubileeCalculation.insuranceCovered,
          patientCopayment: jubileeCalculation.patientCopayment,
          deductibleAmount: jubileeCalculation.deductibleAmount,
          copaymentPercentage: jubileeCalculation.copaymentPercentage,
          breakdown: {
            subtotal: totalAmount,
            deductible: jubileeCalculation.deductibleAmount,
            copaymentAmount: jubileeCalculation.patientCopayment - jubileeCalculation.deductibleAmount,
            insuranceAmount: jubileeCalculation.insuranceCovered,
            patientOwes: jubileeCalculation.patientCopayment
          },
          insuranceProvider: 'JUBILEE'
        };
        break;

      case 'NHIF':
        // NHIF typically covers 100% for approved procedures
        result = {
          totalAmount,
          insuranceCovered: totalAmount,
          patientCopayment: 0,
          copaymentPercentage: 0,
          breakdown: {
            subtotal: totalAmount,
            deductible: 0,
            copaymentAmount: 0,
            insuranceAmount: totalAmount,
            patientOwes: 0
          },
          insuranceProvider: 'NHIF'
        };
        break;

      default:
        // Cash payment - patient pays 100%
        result = {
          totalAmount,
          insuranceCovered: 0,
          patientCopayment: totalAmount,
          copaymentPercentage: 100,
          breakdown: {
            subtotal: totalAmount,
            deductible: 0,
            copaymentAmount: totalAmount,
            insuranceAmount: 0,
            patientOwes: totalAmount
          },
          insuranceProvider: 'CASH'
        };
    }

    return result;
  },

  // Format currency for display
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-TZ', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount) + ' Tsh';
  },

  // Get copayment summary text
  getCopaymentSummary(calculation: CopaymentCalculation): string {
    const { insuranceProvider, breakdown } = calculation;
    
    if (insuranceProvider === 'CASH') {
      return `Cash payment: ${this.formatCurrency(breakdown.patientOwes)}`;
    }

    let summary = `${insuranceProvider} covers: ${this.formatCurrency(breakdown.insuranceAmount)}`;
    
    if (breakdown.deductible > 0) {
      summary += ` | Deductible: ${this.formatCurrency(breakdown.deductible)}`;
    }
    
    if (breakdown.copaymentAmount > 0) {
      summary += ` | Copayment: ${this.formatCurrency(breakdown.copaymentAmount)}`;
    }
    
    summary += ` | Patient pays: ${this.formatCurrency(breakdown.patientOwes)}`;
    
    return summary;
  },

  // Validate insurance coverage for treatments
  async validateCoverage(
    treatments: TreatmentItem[],
    insuranceProvider: string,
    memberNumber: string
  ): Promise<{
    isValid: boolean;
    coveredItems: TreatmentItem[];
    uncoveredItems: TreatmentItem[];
    warnings: string[];
  }> {
    const warnings: string[] = [];
    const coveredItems: TreatmentItem[] = [];
    const uncoveredItems: TreatmentItem[] = [];

    for (const treatment of treatments) {
      // Simulate coverage validation based on insurance provider
      let isCovered = true;

      switch (insuranceProvider.toUpperCase()) {
        case 'GA':
          // GA might not cover cosmetic procedures
          if (treatment.name.toLowerCase().includes('bleaching') || 
              treatment.name.toLowerCase().includes('whitening')) {
            isCovered = false;
            warnings.push(`${treatment.name} may not be covered by GA insurance`);
          }
          break;

        case 'JUBILEE':
          // Jubilee might have quantity limits
          if (treatment.quantity > 2) {
            warnings.push(`${treatment.name} quantity (${treatment.quantity}) may exceed Jubilee limits`);
          }
          break;

        case 'NHIF':
          // NHIF has specific procedure lists
          if (treatment.cost > 100000) {
            warnings.push(`${treatment.name} may require pre-authorization from NHIF`);
          }
          break;
      }

      if (isCovered) {
        coveredItems.push(treatment);
      } else {
        uncoveredItems.push(treatment);
      }
    }

    return {
      isValid: uncoveredItems.length === 0,
      coveredItems,
      uncoveredItems,
      warnings
    };
  },

  // Calculate payment plan options
  calculatePaymentPlan(
    totalAmount: number,
    patientCopayment: number,
    options: {
      installments?: number;
      downPaymentPercentage?: number;
    } = {}
  ): {
    fullPayment: number;
    installmentPlan?: {
      downPayment: number;
      monthlyPayment: number;
      numberOfMonths: number;
      totalWithInterest: number;
    };
  } {
    const { installments = 3, downPaymentPercentage = 30 } = options;

    const result: any = {
      fullPayment: patientCopayment
    };

    if (patientCopayment > 50000) { // Only offer installments for amounts > 50,000 Tsh
      const downPayment = Math.floor(patientCopayment * (downPaymentPercentage / 100));
      const remainingAmount = patientCopayment - downPayment;
      const monthlyPayment = Math.ceil(remainingAmount / installments);
      const totalWithInterest = downPayment + (monthlyPayment * installments);

      result.installmentPlan = {
        downPayment,
        monthlyPayment,
        numberOfMonths: installments,
        totalWithInterest
      };
    }

    return result;
  }
};
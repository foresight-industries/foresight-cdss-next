'use client';

import { useState } from 'react';
import { CreditCard, Download, Calendar, AlertCircle, CheckCircle, Plus, Edit, Receipt } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function BillingPage() {
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [newCardForm, setNewCardForm] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    name: '',
    billingAddress: '',
    city: '',
    state: '',
    zipCode: ''
  });

  // Mock billing data
  const currentPlan = {
    name: 'Professional',
    price: '$299/month',
    billingCycle: 'Monthly',
    nextBillingDate: 'February 15, 2025',
    status: 'Active',
    features: [
      'Up to 1,000 PA requests/month',
      'Advanced analytics',
      'Priority support',
      'API access',
      'Custom integrations'
    ]
  };

  const paymentMethods = [
    {
      id: '1',
      type: 'Visa',
      last4: '4242',
      expiryDate: '12/26',
      isDefault: true
    },
    {
      id: '2',
      type: 'Mastercard',
      last4: '8888',
      expiryDate: '08/25',
      isDefault: false
    }
  ];

  const billingHistory = [
    {
      id: 'INV-2025-001',
      date: 'Jan 15, 2025',
      description: 'Professional Plan - Monthly',
      amount: '$299.00',
      status: 'Paid',
      downloadUrl: '#'
    },
    {
      id: 'INV-2024-012',
      date: 'Dec 15, 2024',
      description: 'Professional Plan - Monthly',
      amount: '$299.00',
      status: 'Paid',
      downloadUrl: '#'
    },
    {
      id: 'INV-2024-011',
      date: 'Nov 15, 2024',
      description: 'Professional Plan - Monthly',
      amount: '$299.00',
      status: 'Paid',
      downloadUrl: '#'
    },
    {
      id: 'INV-2024-010',
      date: 'Oct 15, 2024',
      description: 'Professional Plan - Monthly',
      amount: '$299.00',
      status: 'Paid',
      downloadUrl: '#'
    }
  ];

  const usage = {
    currentMonth: {
      requests: 743,
      limit: 1000,
      percentage: 74.3
    },
    averageMonthly: 856
  };

  const handleAddCard = () => {
    // In real implementation, this would process the payment method
    console.log('Adding payment method:', newCardForm);
    setNewCardForm({
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      name: '',
      billingAddress: '',
      city: '',
      state: '',
      zipCode: ''
    });
    setShowAddCardModal(false);
    alert('Payment method added successfully!');
  };

  const handleCardFormChange = (key: string, value: string) => {
    setNewCardForm(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Billing & Subscription</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your subscription, payment methods, and billing history</p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Download Invoice
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Plan & Usage */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Plan */}
          <Card className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Current Plan</h3>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{currentPlan.name}</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {currentPlan.status}
                  </Badge>
                </div>
                <p className="text-lg text-muted-foreground mt-1">{currentPlan.price}</p>
              </div>
              <Button variant="outline" size="sm">
                <Edit className="w-4 h-4 mr-2" />
                Change Plan
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <Label className="text-sm font-medium">Billing Cycle</Label>
                <p className="text-sm text-muted-foreground">{currentPlan.billingCycle}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Next Billing Date</Label>
                <p className="text-sm text-muted-foreground">{currentPlan.nextBillingDate}</p>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Plan Features</Label>
              <ul className="text-sm text-muted-foreground space-y-1">
                {currentPlan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <CheckCircle className="w-3 h-3 mr-2 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          {/* Usage Statistics */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Usage This Month</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-sm font-medium">PA Requests</Label>
                  <span className="text-sm text-muted-foreground">
                    {usage.currentMonth.requests.toLocaleString()} / {usage.currentMonth.limit.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${usage.currentMonth.percentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {usage.currentMonth.percentage}% of monthly limit used
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <Label className="text-sm font-medium">This Month</Label>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{usage.currentMonth.requests.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">PA requests</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Average Monthly</Label>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{usage.averageMonthly.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">PA requests</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Billing History */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Billing History</h3>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download All
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billingHistory.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">{invoice.id}</div>
                        <div className="text-sm text-muted-foreground">{invoice.date}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-900 dark:text-gray-100">{invoice.description}</TableCell>
                    <TableCell className="font-medium text-gray-900 dark:text-gray-100">{invoice.amount}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>

        {/* Payment Methods */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Payment Methods</h3>
              <Button size="sm" onClick={() => setShowAddCardModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Card
              </Button>
            </div>

            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <div key={method.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{method.type} •••• {method.last4}</p>
                        <p className="text-xs text-muted-foreground">Expires {method.expiryDate}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {method.isDefault && (
                        <Badge variant="secondary" className="text-xs">Default</Badge>
                      )}
                      <Button variant="ghost" size="sm">
                        <Edit className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Receipt className="w-4 h-4 mr-2" />
                Request Invoice Copy
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="w-4 h-4 mr-2" />
                Update Billing Date
              </Button>
              <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700">
                <AlertCircle className="w-4 h-4 mr-2" />
                Cancel Subscription
              </Button>
            </div>
          </Card>

          {/* Support Info */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Need Help?</h3>
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                Have questions about your billing? Our support team is here to help.
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Contact Support
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Add Payment Method Modal */}
      <Dialog open={showAddCardModal} onOpenChange={setShowAddCardModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <CreditCard className="w-5 h-5 mr-2 text-primary" />
              Add Payment Method
            </DialogTitle>
            <DialogDescription>
              Add a new credit or debit card to your account.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cardNumber">Card Number</Label>
              <Input
                id="cardNumber"
                placeholder="1234 5678 9012 3456"
                value={newCardForm.cardNumber}
                onChange={(e) => handleCardFormChange('cardNumber', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  placeholder="MM/YY"
                  value={newCardForm.expiryDate}
                  onChange={(e) => handleCardFormChange('expiryDate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  placeholder="123"
                  value={newCardForm.cvv}
                  onChange={(e) => handleCardFormChange('cvv', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Cardholder Name</Label>
              <Input
                id="name"
                placeholder="Jane Doe"
                value={newCardForm.name}
                onChange={(e) => handleCardFormChange('name', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="billingAddress">Billing Address</Label>
              <Input
                id="billingAddress"
                placeholder="123 Main Street"
                value={newCardForm.billingAddress}
                onChange={(e) => handleCardFormChange('billingAddress', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="New York"
                  value={newCardForm.city}
                  onChange={(e) => handleCardFormChange('city', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Select value={newCardForm.state} onValueChange={(value) => handleCardFormChange('state', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="NY" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NY">NY</SelectItem>
                    <SelectItem value="CA">CA</SelectItem>
                    <SelectItem value="TX">TX</SelectItem>
                    <SelectItem value="FL">FL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP</Label>
                <Input
                  id="zipCode"
                  placeholder="10001"
                  value={newCardForm.zipCode}
                  onChange={(e) => handleCardFormChange('zipCode', e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddCardModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddCard}
              disabled={!newCardForm.cardNumber || !newCardForm.name || !newCardForm.expiryDate || !newCardForm.cvv}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Card
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

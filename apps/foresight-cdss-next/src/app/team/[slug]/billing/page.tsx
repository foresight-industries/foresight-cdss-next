'use client';

import { useState } from 'react';
import { CreditCard, Download, Calendar, AlertCircle, CheckCircle, Plus, Edit, Receipt } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function BillingPage() {
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [showChangePlanModal, setShowChangePlanModal] = useState(false);
  const [showEditCardModal, setShowEditCardModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('professional');
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
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
  const [editCardForm, setEditCardForm] = useState({
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

  const availablePlans = [
    {
      id: 'starter',
      name: 'Starter',
      price: '$99',
      billingPeriod: 'month',
      features: [
        'Up to 250 PA requests/month',
        'Basic analytics',
        'Email support',
        'Standard processing'
      ],
      recommended: false
    },
    {
      id: 'professional',
      name: 'Professional',
      price: '$299',
      billingPeriod: 'month',
      features: [
        'Up to 1,000 PA requests/month',
        'Advanced analytics',
        'Priority support',
        'API access',
        'Custom integrations'
      ],
      recommended: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'Custom',
      billingPeriod: '',
      features: [
        'Unlimited PA requests',
        'Real-time analytics',
        'Dedicated support team',
        'Custom API limits',
        'White-label options',
        'SLA guarantee'
      ],
      recommended: false
    }
  ];

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

  const handleEditCardFormChange = (key: string, value: string) => {
    setEditCardForm(prev => ({ ...prev, [key]: value }));
  };

  const handleChangePlan = () => {
    // In real implementation, this would update the subscription
    console.log('Changing plan to:', selectedPlan);
    const newPlan = availablePlans.find(p => p.id === selectedPlan);
    if (newPlan) {
      alert(`Plan changed to ${newPlan.name}. Your next billing cycle will reflect the new pricing.`);
      setShowChangePlanModal(false);
    }
  };

  const handleEditCard = (cardId: string) => {
    const card = paymentMethods.find(m => m.id === cardId);
    if (card) {
      setEditingCardId(cardId);
      // Pre-fill with masked data
      setEditCardForm({
        cardNumber: `•••• •••• •••• ${card.last4}`,
        expiryDate: card.expiryDate,
        cvv: '',
        name: 'Jane Doe', // In real app, this would come from the card data
        billingAddress: '123 Main Street',
        city: 'New York',
        state: 'NY',
        zipCode: '10001'
      });
      setShowEditCardModal(true);
    }
  };

  const handleUpdateCard = () => {
    console.log('Updating card:', editingCardId, editCardForm);
    setEditCardForm({
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      name: '',
      billingAddress: '',
      city: '',
      state: '',
      zipCode: ''
    });
    setShowEditCardModal(false);
    alert('Payment method updated successfully!');
  };

  const handleCancelSubscription = () => {
    console.log('Cancelling subscription');
    setShowCancelModal(false);
    alert('Your subscription will be cancelled at the end of your current billing period. You will continue to have access until February 15, 2025.');
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
              <Button variant="outline" size="sm" onClick={() => setShowChangePlanModal(true)}>
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
                      <Button variant="ghost" size="sm" onClick={() => handleEditCard(method.id)}>
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
              <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700" onClick={() => setShowCancelModal(true)}>
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
              <Button variant="outline" size="sm" className="w-full" onClick={() => window.open('mailto:support@have-foresight.com?subject=Billing Support Request', '_blank')}>
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

      {/* Change Plan Modal */}
      <Dialog open={showChangePlanModal} onOpenChange={setShowChangePlanModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Change Subscription Plan</DialogTitle>
            <DialogDescription>
              Select a new plan that best fits your needs. Changes will take effect at the beginning of your next billing cycle.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
            {availablePlans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative cursor-pointer transition-all ${
                  selectedPlan === plan.id
                    ? 'ring-2 ring-primary'
                    : 'hover:shadow-lg'
                }`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                <CardContent className="p-6">
                  {plan.recommended && (
                    <Badge className="absolute -top-3 left-4 bg-primary">
                      Recommended
                    </Badge>
                  )}

                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">{plan.name}</h3>
                    <div className={`w-5 h-5 rounded-full border-2 ${
                      selectedPlan === plan.id
                        ? 'bg-primary border-primary'
                        : 'border-gray-300'
                    }`}>
                      {selectedPlan === plan.id && (
                        <CheckCircle className="w-4 h-4 text-white" />
                      )}
                    </div>
                  </div>

                  <div className="mb-4">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    {plan.billingPeriod && (
                      <span className="text-muted-foreground">/{plan.billingPeriod}</span>
                    )}
                  </div>

                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start text-sm">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {plan.id === 'professional' && (
                    <Badge variant="secondary" className="w-full justify-center">
                      Current Plan
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-4">
            <div className="flex-1 text-sm text-muted-foreground">
              {selectedPlan !== 'professional' && (
                <p>
                  {selectedPlan === 'enterprise'
                    ? 'Our team will contact you to discuss custom pricing'
                    : 'You will be charged at the start of your next billing cycle'}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowChangePlanModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleChangePlan}
                disabled={selectedPlan === 'professional'}
              >
                {selectedPlan === 'enterprise' ? 'Contact Sales' : 'Confirm Change'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Payment Method Modal */}
      <Dialog open={showEditCardModal} onOpenChange={setShowEditCardModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Edit className="w-5 h-5 mr-2 text-primary" />
              Edit Payment Method
            </DialogTitle>
            <DialogDescription>
              Update your payment method information.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editCardNumber">Card Number</Label>
              <Input
                id="editCardNumber"
                placeholder="1234 5678 9012 3456"
                value={editCardForm.cardNumber}
                onChange={(e) => handleEditCardFormChange('cardNumber', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="editExpiryDate">Expiry Date</Label>
                <Input
                  id="editExpiryDate"
                  placeholder="MM/YY"
                  value={editCardForm.expiryDate}
                  onChange={(e) => handleEditCardFormChange('expiryDate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editCvv">CVV</Label>
                <Input
                  id="editCvv"
                  placeholder="123"
                  value={editCardForm.cvv}
                  onChange={(e) => handleEditCardFormChange('cvv', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editName">Cardholder Name</Label>
              <Input
                id="editName"
                placeholder="Jane Doe"
                value={editCardForm.name}
                onChange={(e) => handleEditCardFormChange('name', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editBillingAddress">Billing Address</Label>
              <Input
                id="editBillingAddress"
                placeholder="123 Main Street"
                value={editCardForm.billingAddress}
                onChange={(e) => handleEditCardFormChange('billingAddress', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="editCity">City</Label>
                <Input
                  id="editCity"
                  placeholder="New York"
                  value={editCardForm.city}
                  onChange={(e) => handleEditCardFormChange('city', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editState">State</Label>
                <Select value={editCardForm.state} onValueChange={(value) => handleEditCardFormChange('state', value)}>
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
                <Label htmlFor="editZipCode">ZIP</Label>
                <Input
                  id="editZipCode"
                  placeholder="10001"
                  value={editCardForm.zipCode}
                  onChange={(e) => handleEditCardFormChange('zipCode', e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditCardModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateCard}
              disabled={!editCardForm.cardNumber || !editCardForm.name || !editCardForm.expiryDate || !editCardForm.cvv}
            >
              <Edit className="w-4 h-4 mr-2" />
              Update Card
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Subscription Modal */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <AlertCircle className="w-5 h-5 mr-2" />
              Cancel Subscription
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your subscription? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">What happens when you cancel:</h4>
              <ul className="text-sm text-red-700 dark:text-red-200 space-y-1">
                <li>• Your subscription will end on {currentPlan.nextBillingDate}</li>
                <li>• You&apos;ll lose access to all premium features</li>
                <li>• Your data will be preserved for 30 days</li>
                <li>• No future charges will be made</li>
              </ul>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Consider downgrading instead:</h4>
              <p className="text-sm text-blue-700 dark:text-blue-200">
                Switch to our Starter plan for $99/month and keep basic access to your PA processing tools.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelModal(false)}
            >
              Keep Subscription
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelSubscription}
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              Yes, Cancel Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
